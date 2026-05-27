import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_admin_user, get_current_user
from app.database import get_db
from app.models import Coupon, CouponStatus, CouponTier, EntrySource, Lottery, Ticket, User
from app.schemas import CouponCreate, CouponOut, CouponRedeem, TicketOut

router = APIRouter(prefix="/api/coupons", tags=["coupons"])


@router.get("", response_model=list[CouponOut])
async def list_coupons(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = select(Coupon).where(Coupon.user_id == user.id).order_by(Coupon.created_at.desc())
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/admin/{user_id}", response_model=list[CouponOut])
async def admin_list_coupons(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    q = select(Coupon).where(Coupon.user_id == user_id).order_by(Coupon.created_at.desc())
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=CouponOut, status_code=status.HTTP_201_CREATED)
async def create_coupon(
    body: CouponCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    coupon = Coupon(
        user_id=body.user_id,
        tier=body.tier,
        source=body.source,
        source_ref=body.source_ref,
        lottery_id=body.lottery_id,
        expires_at=body.expires_at,
    )
    db.add(coupon)
    await db.commit()
    await db.refresh(coupon)
    return coupon


@router.post("/redeem", response_model=TicketOut)
async def redeem_coupons(
    body: CouponRedeem,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Validate lottery
    lot_result = await db.execute(select(Lottery).where(Lottery.id == body.lottery_id))
    lottery = lot_result.scalar_one_or_none()
    if not lottery:
        raise HTTPException(status_code=404, detail="Lottery not found")
    if not lottery.coupon_entry_enabled:
        raise HTTPException(status_code=400, detail="Coupon entry not enabled for this lottery")

    # Parse coupon entry rules
    rules = []
    if lottery.coupon_entry_rules:
        try:
            rules = json.loads(lottery.coupon_entry_rules)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid coupon entry rules")

    if not rules:
        raise HTTPException(status_code=400, detail="No coupon entry rules configured")

    # Fetch coupons
    coupons_result = await db.execute(
        select(Coupon).where(
            Coupon.id.in_(body.coupons),
            Coupon.user_id == user.id,
            Coupon.status == CouponStatus.ACTIVE,
        )
    )
    coupons = coupons_result.scalars().all()

    if len(coupons) != len(body.coupons):
        raise HTTPException(status_code=400, detail="Some coupons not found or already redeemed")

    # Check if coupons are expired
    now = datetime.now(timezone.utc)
    for c in coupons:
        if c.expires_at and c.expires_at < now:
            raise HTTPException(status_code=400, detail=f"Coupon {c.id} has expired")

    # Count by tier
    tier_counts: dict[str, int] = {}
    for c in coupons:
        tier_counts[c.tier.value] = tier_counts.get(c.tier.value, 0) + 1

    # Check if any rule is satisfied
    entries_earned = 0
    for rule in rules:
        tier = rule.get("tier", "")
        required = rule.get("count", 1)
        available = tier_counts.get(tier, 0)
        if available >= required:
            entries_earned += available // required

    if entries_earned == 0:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient coupons. Rules require: {json.dumps(rules)}. You provided: {tier_counts}",
        )

    # Mark coupons as redeemed
    for c in coupons:
        c.status = CouponStatus.REDEEMED
        c.redeemed_at = now

    # Create ticket(s)
    import secrets
    ticket_code = secrets.token_hex(8).upper()
    ticket = Ticket(
        lottery_id=body.lottery_id,
        user_id=user.id,
        ticket_code=ticket_code,
        source=EntrySource.COUPON_REDEMPTION,
        purchase_price=lottery.ticket_price,
        currency=lottery.currency,
    )
    db.add(ticket)
    await db.commit()

    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Ticket).options(selectinload(Ticket.lottery), selectinload(Ticket.user))
        .where(Ticket.id == ticket.id)
    )
    ticket = result.scalar_one()

    from app.routers.tickets import _ticket_to_out
    return _ticket_to_out(ticket)


@router.get("/stats", response_model=dict)
async def coupon_stats(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Coupon.tier, func.count())
        .where(Coupon.user_id == user.id, Coupon.status == CouponStatus.ACTIVE)
        .group_by(Coupon.tier)
    )
    rows = result.all()
    stats = {"bronze": 0, "silver": 0, "gold": 0}
    for tier, count in rows:
        stats[tier.value] = count
    return stats
