import json
import secrets
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
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
from app.schemas import (
    GameSessionOut,
    GameStartRequest,
    GameSubmitScore,
    TicketOut,
)

router = APIRouter(prefix="/api/game", tags=["game"])


@router.post("/start", response_model=GameSessionOut)
async def start_game(
    body: GameStartRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Start a game session for a lottery with game layer enabled."""
    result = await db.execute(select(Lottery).where(Lottery.id == body.lottery_id))
    lottery = result.scalar_one_or_none()
    if not lottery:
        raise HTTPException(status_code=404, detail="Lottery not found")
    if not lottery.game_layer_enabled:
        raise HTTPException(status_code=400, detail="Game layer not enabled for this lottery")
    if lottery.status.value != "active":
        raise HTTPException(status_code=400, detail="Lottery is not active")

    session = GameSession(
        user_id=user.id,
        lottery_id=lottery.id,
        game_type=lottery.game_layer_type,
        min_score_required=lottery.game_min_score,
        max_score=lottery.game_max_score,
        duration_seconds=lottery.game_duration_seconds,
        entry_price_paid=lottery.game_entry_price or Decimal("0.00"),
        target_lotteries=lottery.game_target_lotteries,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    out = GameSessionOut.model_validate(session)
    out.qualified = False
    out.tickets_created = []
    return out


@router.post("/submit", response_model=GameSessionOut)
async def submit_score(
    body: GameSubmitScore,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Submit game score. If score >= min, auto-create lottery tickets."""
    result = await db.execute(
        select(GameSession).where(
            GameSession.id == body.session_id,
            GameSession.user_id == user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Game session not found")
    if session.status != GameSessionStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Game session already completed")

    session.score = body.score
    session.completed_at = datetime.now(timezone.utc)

    qualified = body.score >= session.min_score_required
    tickets_created = []

    if qualified:
        session.status = GameSessionStatus.QUALIFIED

        # Determine which lotteries to assign entries to
        target_lottery_ids = []
        if session.target_lotteries:
            try:
                targets = json.loads(session.target_lotteries)
                if targets == "all":
                    # Get all active lotteries
                    res = await db.execute(
                        select(Lottery).where(Lottery.status == "active")
                    )
                    target_lottery_ids = [l.id for l in res.scalars().all()]
                elif isinstance(targets, list):
                    target_lottery_ids = targets
            except (json.JSONDecodeError, TypeError):
                target_lottery_ids = [session.lottery_id]
        else:
            target_lottery_ids = [session.lottery_id]

        # Get lottery for entries_per_win setting
        lot_result = await db.execute(select(Lottery).where(Lottery.id == session.lottery_id))
        source_lottery = lot_result.scalar_one_or_none()
        entries_per_win = source_lottery.game_entries_per_win if source_lottery else 1

        # Create tickets for each target lottery
        total_tickets = 0
        for lot_id in target_lottery_ids:
            for _ in range(entries_per_win):
                ticket = Ticket(
                    lottery_id=lot_id,
                    user_id=user.id,
                    ticket_code=secrets.token_hex(6).upper(),
                    source=EntrySource.GAME_WIN,
                    status=TicketStatus.ACTIVE,
                    purchase_price=session.entry_price_paid,
                    currency="EUR",
                )
                db.add(ticket)
                total_tickets += 1
                tickets_created.append(ticket)

        session.tickets_awarded = total_tickets
    else:
        session.status = GameSessionStatus.FAILED

    await db.commit()
    await db.refresh(session)

    out = GameSessionOut.model_validate(session)
    out.qualified = qualified
    out.tickets_created = [
        TicketOut(
            id=t.id,
            lottery_id=t.lottery_id,
            user_id=t.user_id,
            ticket_code=t.ticket_code,
            qr_code_data=None,
            source=t.source,
            status=t.status,
            purchase_price=t.purchase_price,
            currency=t.currency,
            created_at=t.created_at,
            validated_at=None,
        )
        for t in tickets_created
    ]
    return out


@router.get("/sessions", response_model=list[GameSessionOut])
async def list_game_sessions(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List current user's game sessions."""
    result = await db.execute(
        select(GameSession)
        .where(GameSession.user_id == user.id)
        .order_by(GameSession.started_at.desc())
        .limit(50)
    )
    sessions = result.scalars().all()
    out = []
    for s in sessions:
        o = GameSessionOut.model_validate(s)
        o.qualified = s.status == GameSessionStatus.QUALIFIED
        out.append(o)
    return out
