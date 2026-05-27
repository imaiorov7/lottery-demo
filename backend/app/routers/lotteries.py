from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_admin_user, get_current_user
from app.database import get_db
from app.models import Lottery, LotteryStatus, PrizeTier, Ticket, User
from app.schemas import (
    LotteryCreate,
    LotteryOut,
    LotteryUpdate,
)

router = APIRouter(prefix="/api/lotteries", tags=["lotteries"])


def _lottery_out(lot: Lottery, ticket_count: int = 0) -> LotteryOut:
    lo = LotteryOut.model_validate(lot)
    lo.ticket_count = ticket_count
    return lo


async def _ticket_count(db: AsyncSession, lottery_id: str) -> int:
    result = await db.execute(
        select(func.count()).where(Ticket.lottery_id == lottery_id)
    )
    return result.scalar() or 0


@router.get("", response_model=list[LotteryOut])
async def list_lotteries(
    status_filter: LotteryStatus | None = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
):
    q = select(Lottery)
    if status_filter:
        q = q.where(Lottery.status == status_filter)
    q = q.order_by(Lottery.created_at.desc())
    result = await db.execute(q)
    lotteries = result.scalars().all()

    out = []
    for lot in lotteries:
        tc = await _ticket_count(db, lot.id)
        out.append(_lottery_out(lot, tc))
    return out


@router.get("/{lottery_id}", response_model=LotteryOut)
async def get_lottery(
    lottery_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Lottery).where(Lottery.id == lottery_id))
    lot = result.scalar_one_or_none()
    if not lot:
        raise HTTPException(status_code=404, detail="Lottery not found")
    tc = await _ticket_count(db, lot.id)
    return _lottery_out(lot, tc)


@router.post("", response_model=LotteryOut, status_code=status.HTTP_201_CREATED)
async def create_lottery(
    body: LotteryCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    data = body.model_dump(exclude={"prize_tiers"})
    lot = Lottery(**data)
    db.add(lot)

    if body.prize_tiers:
        for pt in body.prize_tiers:
            tier = PrizeTier(lottery_id=lot.id, **pt.model_dump())
            db.add(tier)

    await db.commit()
    await db.refresh(lot)
    return _lottery_out(lot, 0)


@router.patch("/{lottery_id}", response_model=LotteryOut)
async def update_lottery(
    lottery_id: str,
    body: LotteryUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    result = await db.execute(select(Lottery).where(Lottery.id == lottery_id))
    lot = result.scalar_one_or_none()
    if not lot:
        raise HTTPException(status_code=404, detail="Lottery not found")

    updates = body.model_dump(exclude_unset=True, exclude={"prize_tiers"})
    for field, val in updates.items():
        setattr(lot, field, val)

    if body.prize_tiers is not None:
        # Replace all prize tiers
        existing = await db.execute(select(PrizeTier).where(PrizeTier.lottery_id == lottery_id))
        for old in existing.scalars().all():
            await db.delete(old)
        for pt in body.prize_tiers:
            tier = PrizeTier(lottery_id=lottery_id, **pt.model_dump())
            db.add(tier)

    await db.commit()
    await db.refresh(lot)
    tc = await _ticket_count(db, lot.id)
    return _lottery_out(lot, tc)


@router.delete("/{lottery_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lottery(
    lottery_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    result = await db.execute(select(Lottery).where(Lottery.id == lottery_id))
    lot = result.scalar_one_or_none()
    if not lot:
        raise HTTPException(status_code=404, detail="Lottery not found")
    await db.delete(lot)
    await db.commit()
