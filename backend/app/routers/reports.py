from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select, cast, Date
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_admin_user
from app.database import get_db
from app.models import (
    EntrySource,
    GameSession,
    GameSessionStatus,
    Lottery,
    Ticket,
    TicketStatus,
    User,
)
from app.schemas import EntryReport, RevenueReport

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/revenue", response_model=RevenueReport)
async def revenue_report(
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    lottery_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """Revenue report with optional date/lottery filters."""
    if not start_date:
        start_date = datetime.now(timezone.utc) - timedelta(days=30)
    if not end_date:
        end_date = datetime.now(timezone.utc)

    q = select(Ticket).where(
        Ticket.created_at >= start_date,
        Ticket.created_at <= end_date,
    )
    if lottery_id:
        q = q.where(Ticket.lottery_id == lottery_id)

    result = await db.execute(q)
    tickets = result.scalars().all()

    total = Decimal("0.00")
    by_source: dict[str, Decimal] = {}
    by_day: dict[str, Decimal] = {}
    by_lottery: dict[str, dict] = {}

    for t in tickets:
        total += t.purchase_price
        src = t.source.value
        by_source[src] = by_source.get(src, Decimal("0.00")) + t.purchase_price
        day = t.created_at.strftime("%Y-%m-%d")
        by_day[day] = by_day.get(day, Decimal("0.00")) + t.purchase_price

        if t.lottery_id not in by_lottery:
            by_lottery[t.lottery_id] = {"lottery_id": t.lottery_id, "name": "", "revenue": Decimal("0.00")}
        by_lottery[t.lottery_id]["revenue"] += t.purchase_price

    # Get lottery names
    if by_lottery:
        lot_result = await db.execute(select(Lottery).where(Lottery.id.in_(by_lottery.keys())))
        for lot in lot_result.scalars().all():
            if lot.id in by_lottery:
                by_lottery[lot.id]["name"] = lot.name

    return RevenueReport(
        total_revenue=total,
        revenue_by_day=[{"date": d, "revenue": str(v)} for d, v in sorted(by_day.items())],
        revenue_by_source={k: v for k, v in by_source.items()},
        revenue_by_lottery=[{"lottery_id": v["lottery_id"], "name": v["name"], "revenue": str(v["revenue"])} for v in by_lottery.values()],
    )


@router.get("/entries", response_model=EntryReport)
async def entries_report(
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    lottery_id: str | None = Query(None),
    source: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """Entry/ticket report with filters."""
    if not start_date:
        start_date = datetime.now(timezone.utc) - timedelta(days=30)
    if not end_date:
        end_date = datetime.now(timezone.utc)

    q = select(Ticket).where(
        Ticket.created_at >= start_date,
        Ticket.created_at <= end_date,
    )
    if lottery_id:
        q = q.where(Ticket.lottery_id == lottery_id)
    if source:
        q = q.where(Ticket.source == source)

    result = await db.execute(q)
    tickets = result.scalars().all()

    by_source: dict[str, int] = {}
    by_day: dict[str, int] = {}
    by_lottery: dict[str, dict] = {}

    for t in tickets:
        src = t.source.value
        by_source[src] = by_source.get(src, 0) + 1
        day = t.created_at.strftime("%Y-%m-%d")
        by_day[day] = by_day.get(day, 0) + 1
        if t.lottery_id not in by_lottery:
            by_lottery[t.lottery_id] = {"lottery_id": t.lottery_id, "name": "", "count": 0}
        by_lottery[t.lottery_id]["count"] += 1

    # Get lottery names
    if by_lottery:
        lot_result = await db.execute(select(Lottery).where(Lottery.id.in_(by_lottery.keys())))
        for lot in lot_result.scalars().all():
            if lot.id in by_lottery:
                by_lottery[lot.id]["name"] = lot.name

    # Game conversion rate
    game_total = await db.execute(
        select(func.count()).where(
            GameSession.started_at >= start_date,
            GameSession.started_at <= end_date,
        )
    )
    game_qualified = await db.execute(
        select(func.count()).where(
            GameSession.started_at >= start_date,
            GameSession.started_at <= end_date,
            GameSession.status == GameSessionStatus.QUALIFIED,
        )
    )
    gt = game_total.scalar() or 0
    gq = game_qualified.scalar() or 0
    conversion = (gq / gt * 100) if gt > 0 else 0.0

    return EntryReport(
        total_entries=len(tickets),
        entries_by_day=[{"date": d, "count": v} for d, v in sorted(by_day.items())],
        entries_by_source=by_source,
        entries_by_lottery=[{"lottery_id": v["lottery_id"], "name": v["name"], "count": v["count"]} for v in by_lottery.values()],
        conversion_rate=round(conversion, 1),
    )
