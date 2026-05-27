from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_admin_user
from app.database import get_db
from app.models import Lottery, LotteryStatus, PartnerConfig, User
from app.schemas import LotteryOut, PartnerConfigCreate, PartnerConfigOut, PartnerConfigUpdate


class PartnerLotterySync(BaseModel):
    """
    Payload the partner pushes (or we pull) to upsert a partner-managed lottery.
    Only entry-channel fields (coupons, direct purchase, game layer) are
    configurable by us — everything else is display-only and comes from the partner.
    """
    external_lottery_id: str
    name: str
    description: str | None = None
    prize_description: str | None = None
    banner_image_url: str | None = None
    start_date: datetime
    end_date: datetime
    draw_date: datetime | None = None
    status: str = "active"           # active | paused | completed
    max_entries_per_user: int = 1
    partner_draw_url: str | None = None
    partner_entry_webhook: str | None = None
    # Our-side entry config (optional, kept from previous sync if omitted)
    coupon_entry_enabled: bool | None = None
    coupon_entry_rules: str | None = None   # JSON
    allow_direct_purchase: bool | None = None
    ticket_price: float | None = None
    currency: str | None = None

router = APIRouter(prefix="/api/partners", tags=["partners"])


@router.get("", response_model=list[PartnerConfigOut])
async def list_partners(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    result = await db.execute(select(PartnerConfig).order_by(PartnerConfig.created_at.desc()))
    return result.scalars().all()


@router.get("/{partner_id}", response_model=PartnerConfigOut)
async def get_partner(
    partner_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    result = await db.execute(select(PartnerConfig).where(PartnerConfig.id == partner_id))
    partner = result.scalar_one_or_none()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    return partner


@router.post("", response_model=PartnerConfigOut, status_code=status.HTTP_201_CREATED)
async def create_partner(
    body: PartnerConfigCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    partner = PartnerConfig(**body.model_dump())
    db.add(partner)
    await db.commit()
    await db.refresh(partner)
    return partner


@router.patch("/{partner_id}", response_model=PartnerConfigOut)
async def update_partner(
    partner_id: str,
    body: PartnerConfigUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    result = await db.execute(select(PartnerConfig).where(PartnerConfig.id == partner_id))
    partner = result.scalar_one_or_none()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(partner, key, val)

    await db.commit()
    await db.refresh(partner)
    return partner


@router.delete("/{partner_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_partner(
    partner_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    result = await db.execute(select(PartnerConfig).where(PartnerConfig.id == partner_id))
    partner = result.scalar_one_or_none()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    await db.delete(partner)
    await db.commit()


@router.post("/{partner_id}/sync-lottery", response_model=LotteryOut)
async def sync_partner_lottery(
    partner_id: str,
    body: PartnerLotterySync,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """
    Upsert a partner-managed lottery from a sync payload.
    Partner controls: name, description, dates, draw_date, status, prize info.
    We control: coupon_entry_enabled/rules, allow_direct_purchase, ticket_price.
    If the lottery already exists (matched by partner_id + external_lottery_id)
    we update the partner-owned fields and optionally our-side config.
    """
    result = await db.execute(select(PartnerConfig).where(PartnerConfig.id == partner_id))
    partner = result.scalar_one_or_none()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    # Try to find existing
    existing = await db.execute(
        select(Lottery).where(
            Lottery.partner_id == partner_id,
            Lottery.external_lottery_id == body.external_lottery_id,
        )
    )
    lottery = existing.scalar_one_or_none()

    now = datetime.now(timezone.utc)

    # Map status string to enum
    status_map = {
        "active": LotteryStatus.ACTIVE,
        "paused": LotteryStatus.PAUSED,
        "completed": LotteryStatus.COMPLETED,
        "cancelled": LotteryStatus.CANCELLED,
    }
    mapped_status = status_map.get(body.status, LotteryStatus.ACTIVE)

    if lottery is None:
        # Create new partner-managed lottery
        lottery = Lottery(
            is_partner_managed=True,
            partner_id=partner_id,
            external_lottery_id=body.external_lottery_id,
            name=body.name,
            description=body.description,
            prize_description=body.prize_description,
            banner_image_url=body.banner_image_url,
            start_date=body.start_date,
            end_date=body.end_date,
            draw_date=body.draw_date,
            status=mapped_status,
            max_entries_per_user=body.max_entries_per_user,
            partner_draw_url=body.partner_draw_url,
            partner_entry_webhook=body.partner_entry_webhook,
            # Our-side config defaults
            coupon_entry_enabled=body.coupon_entry_enabled or False,
            coupon_entry_rules=body.coupon_entry_rules,
            allow_direct_purchase=body.allow_direct_purchase or False,
            ticket_price=body.ticket_price or 0,
            currency=body.currency or "EUR",
            last_synced_at=now,
        )
        db.add(lottery)
    else:
        # Update partner-owned fields (these come from their system)
        lottery.name = body.name
        lottery.description = body.description
        lottery.prize_description = body.prize_description
        lottery.banner_image_url = body.banner_image_url
        lottery.start_date = body.start_date
        lottery.end_date = body.end_date
        lottery.draw_date = body.draw_date
        lottery.status = mapped_status
        lottery.max_entries_per_user = body.max_entries_per_user
        lottery.partner_draw_url = body.partner_draw_url
        lottery.partner_entry_webhook = body.partner_entry_webhook
        lottery.last_synced_at = now
        # Only update our-side config if explicitly provided in the payload
        if body.coupon_entry_enabled is not None:
            lottery.coupon_entry_enabled = body.coupon_entry_enabled
        if body.coupon_entry_rules is not None:
            lottery.coupon_entry_rules = body.coupon_entry_rules
        if body.allow_direct_purchase is not None:
            lottery.allow_direct_purchase = body.allow_direct_purchase
        if body.ticket_price is not None:
            lottery.ticket_price = body.ticket_price
        if body.currency is not None:
            lottery.currency = body.currency

    # Update partner last_synced_at
    partner.last_synced_at = now
    await db.commit()
    await db.refresh(lottery)
    return lottery


@router.get("/{partner_id}/lotteries", response_model=list[LotteryOut])
async def list_partner_lotteries(
    partner_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """List all lotteries synced from this partner."""
    result = await db.execute(select(PartnerConfig).where(PartnerConfig.id == partner_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Partner not found")
    lots = await db.execute(
        select(Lottery).where(Lottery.partner_id == partner_id).order_by(Lottery.created_at.desc())
    )
    return lots.scalars().all()
