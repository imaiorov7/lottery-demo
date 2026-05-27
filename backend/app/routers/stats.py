from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_admin_user
from app.database import get_db
from app.models import Lottery, Ticket, TicketStatus, Transaction, TransactionStatus, User
from app.schemas import (
    DashboardStats,
    DrawRequest,
    DrawResult,
    LotteryStats,
    TicketOut,
)

router = APIRouter(prefix="/api", tags=["stats", "draw"])


def _ticket_to_out(ticket: Ticket) -> TicketOut:
    return TicketOut(
        id=ticket.id,
        lottery_id=ticket.lottery_id,
        user_id=ticket.user_id,
        ticket_code=ticket.ticket_code,
        qr_code_data=ticket.qr_code_data,
        source=ticket.source,
        status=ticket.status,
        purchase_price=ticket.purchase_price,
        currency=ticket.currency,
        created_at=ticket.created_at,
        validated_at=ticket.validated_at,
        lottery_name=ticket.lottery.name if ticket.lottery else None,
        user_name=ticket.user.full_name if ticket.user else None,
    )


@router.get("/dashboard", response_model=DashboardStats)
async def dashboard(db: AsyncSession = Depends(get_db), _admin: User = Depends(get_admin_user)):
    active = await db.execute(
        select(func.count()).select_from(Lottery).where(Lottery.status == "active")
    )
    active_lotteries = active.scalar() or 0

    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    tickets_today = await db.execute(
        select(func.count()).select_from(Ticket).where(Ticket.created_at >= today)
    )
    total_tickets_today = tickets_today.scalar() or 0

    revenue_today = await db.execute(
        select(func.coalesce(func.sum(Ticket.purchase_price), 0))
        .where(Ticket.created_at >= today)
    )
    total_revenue_today = revenue_today.scalar() or 0

    total_users = await db.execute(select(func.count()).select_from(User))
    total_users_count = total_users.scalar() or 0

    recent = await db.execute(
        select(Ticket)
        .options(selectinload(Ticket.lottery), selectinload(Ticket.user))
        .order_by(Ticket.created_at.desc()).limit(10)
    )
    recent_tickets = [_ticket_to_out(t) for t in recent.scalars().all()]

    return DashboardStats(
        active_lotteries=active_lotteries,
        total_tickets_today=total_tickets_today,
        total_revenue_today=total_revenue_today,
        total_users=total_users_count,
        recent_tickets=recent_tickets,
    )


@router.get("/lotteries/{lottery_id}/stats", response_model=LotteryStats)
async def lottery_stats(
    lottery_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    result = await db.execute(select(Lottery).where(Lottery.id == lottery_id))
    lot = result.scalar_one_or_none()
    if not lot:
        raise HTTPException(status_code=404, detail="Lottery not found")

    total = await db.execute(
        select(func.count()).select_from(Ticket).where(Ticket.lottery_id == lottery_id)
    )
    total_tickets = total.scalar() or 0

    by_source = {}
    for src in ("casino_play", "direct_purchase", "physical_sale"):
        c = await db.execute(
            select(func.count())
            .select_from(Ticket)
            .where(Ticket.lottery_id == lottery_id, Ticket.source == src)
        )
        by_source[src] = c.scalar() or 0

    by_status = {}
    for st in ("active", "checked", "won", "lost", "void"):
        c = await db.execute(
            select(func.count())
            .select_from(Ticket)
            .where(Ticket.lottery_id == lottery_id, Ticket.status == st)
        )
        by_status[st] = c.scalar() or 0

    revenue = await db.execute(
        select(func.coalesce(func.sum(Ticket.purchase_price), 0))
        .where(Ticket.lottery_id == lottery_id)
    )
    total_revenue = revenue.scalar() or 0

    participants = await db.execute(
        select(func.count(func.distinct(Ticket.user_id)))
        .where(Ticket.lottery_id == lottery_id)
    )
    unique_participants = participants.scalar() or 0

    return LotteryStats(
        lottery_id=lottery_id,
        lottery_name=lot.name,
        total_tickets=total_tickets,
        tickets_by_source=by_source,
        tickets_by_status=by_status,
        total_revenue=total_revenue,
        unique_participants=unique_participants,
    )


@router.post("/draw", response_model=DrawResult)
async def draw_winners(
    body: DrawRequest,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    result = await db.execute(select(Lottery).where(Lottery.id == body.lottery_id))
    lot = result.scalar_one_or_none()
    if not lot:
        raise HTTPException(status_code=404, detail="Lottery not found")

    # Get all active tickets for this lottery
    tickets_result = await db.execute(
        select(Ticket)
        .options(selectinload(Ticket.lottery), selectinload(Ticket.user))
        .where(Ticket.lottery_id == body.lottery_id, Ticket.status == TicketStatus.ACTIVE)
        .order_by(func.random())
        .limit(body.winner_count)
    )
    winners = tickets_result.scalars().all()

    if not winners:
        raise HTTPException(status_code=400, detail="No active tickets to draw from")

    drawn_at = datetime.now(timezone.utc)
    for t in winners:
        t.status = TicketStatus.WON
        t.validated_at = drawn_at

    # Mark remaining as lost
    remaining = await db.execute(
        select(Ticket).where(
            Ticket.lottery_id == body.lottery_id,
            Ticket.status == TicketStatus.ACTIVE,
        )
    )
    for t in remaining.scalars().all():
        t.status = TicketStatus.LOST

    lot.status = "completed"
    lot.draw_date = drawn_at
    await db.commit()

    return DrawResult(
        lottery_id=body.lottery_id,
        lottery_name=lot.name,
        winners=[_ticket_to_out(w) for w in winners],
        drawn_at=drawn_at,
    )
