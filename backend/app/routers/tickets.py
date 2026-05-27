import secrets
from datetime import datetime, timezone

import qrcode
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_admin_user, get_current_user, get_pos_user
from app.database import get_db
from app.models import (
    EntrySource,
    Lottery,
    LotteryStatus,
    Ticket,
    TicketStatus,
    Transaction,
    TransactionStatus,
    User,
)
from app.schemas import (
    CasinoEligibilityCheck,
    CasinoEligibilityResponse,
    TicketCreate,
    TicketOut,
    TicketValidate,
)

router = APIRouter(prefix="/api/tickets", tags=["tickets"])


def _generate_ticket_code() -> str:
    return secrets.token_hex(8).upper()


def _generate_qr_data(ticket_code: str, lottery_id: str) -> str:
    return f"LOTTERY:{lottery_id}:TICKET:{ticket_code}"


def _make_qr_image(data: str) -> str:
    img = qrcode.make(data)
    import base64
    import io

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


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


@router.get("", response_model=list[TicketOut])
async def list_tickets(
    lottery_id: str | None = None,
    status_filter: TicketStatus | None = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(Ticket).options(selectinload(Ticket.lottery), selectinload(Ticket.user))
    if current_user.role.value not in ("admin", "pos_operator"):
        q = q.where(Ticket.user_id == current_user.id)
    if lottery_id:
        q = q.where(Ticket.lottery_id == lottery_id)
    if status_filter:
        q = q.where(Ticket.status == status_filter)
    q = q.order_by(Ticket.created_at.desc())
    result = await db.execute(q)
    return [_ticket_to_out(t) for t in result.scalars().all()]


@router.get("/{ticket_id}", response_model=TicketOut)
async def get_ticket(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Ticket).options(selectinload(Ticket.lottery), selectinload(Ticket.user))
        .where(Ticket.id == ticket_id)
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if current_user.role.value not in ("admin", "pos_operator") and ticket.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return _ticket_to_out(ticket)


@router.post("", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    body: TicketCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate lottery
    result = await db.execute(select(Lottery).where(Lottery.id == body.lottery_id))
    lottery = result.scalar_one_or_none()
    if not lottery:
        raise HTTPException(status_code=404, detail="Lottery not found")
    if lottery.status != LotteryStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Lottery is not active")

    # Check channel availability
    if body.source == EntrySource.CASINO_PLAY and not lottery.allow_casino_eligibility:
        raise HTTPException(status_code=400, detail="Casino eligibility not enabled for this lottery")
    if body.source == EntrySource.DIRECT_PURCHASE and not lottery.allow_direct_purchase:
        raise HTTPException(status_code=400, detail="Direct purchase not enabled for this lottery")
    if body.source == EntrySource.PHYSICAL_SALE and not lottery.allow_physical_sales:
        raise HTTPException(status_code=400, detail="Physical sales not enabled for this lottery")
    if body.source == EntrySource.GAME_WIN and not lottery.game_layer_enabled:
        raise HTTPException(status_code=400, detail="Game layer not enabled for this lottery")

    # Check max entries
    count_result = await db.execute(
        select(func.count())
        .select_from(Ticket)
        .where(Ticket.lottery_id == body.lottery_id, Ticket.user_id == current_user.id)
    )
    if count_result.scalar() >= lottery.max_entries_per_user:
        raise HTTPException(status_code=400, detail="Maximum entries reached for this lottery")

    price = body.purchase_price if body.purchase_price is not None else lottery.ticket_price
    currency = body.currency or lottery.currency

    ticket_code = _generate_ticket_code()
    qr_data = _generate_qr_data(ticket_code, body.lottery_id)
    qr_img = _make_qr_image(qr_data)

    ticket = Ticket(
        lottery_id=body.lottery_id,
        user_id=current_user.id,
        ticket_code=ticket_code,
        qr_code_data=qr_img,
        source=body.source,
        purchase_price=price,
        currency=currency,
    )
    db.add(ticket)

    if price > 0:
        txn = Transaction(
            user_id=current_user.id,
            amount=price,
            currency=currency,
            status=TransactionStatus.COMPLETED,
            payment_method="demo" if body.source != EntrySource.PHYSICAL_SALE else "pos_cash",
        )
        db.add(txn)
        await db.flush()
        txn.ticket_id = ticket.id

    await db.commit()
    result2 = await db.execute(
        select(Ticket).options(selectinload(Ticket.lottery), selectinload(Ticket.user))
        .where(Ticket.id == ticket.id)
    )
    ticket = result2.scalar_one()
    return _ticket_to_out(ticket)


@router.post("/validate", response_model=TicketOut)
async def validate_ticket(
    body: TicketValidate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_pos_user),
):
    result = await db.execute(
        select(Ticket).options(selectinload(Ticket.lottery), selectinload(Ticket.user))
        .where(Ticket.ticket_code == body.ticket_code)
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.status != TicketStatus.ACTIVE:
        raise HTTPException(status_code=400, detail=f"Ticket already {ticket.status.value}")

    ticket.status = TicketStatus.CHECKED
    ticket.validated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(ticket)
    return _ticket_to_out(ticket)


@router.post("/{ticket_id}/mark-won", response_model=TicketOut)
async def mark_ticket_won(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    result = await db.execute(
        select(Ticket).options(selectinload(Ticket.lottery), selectinload(Ticket.user))
        .where(Ticket.id == ticket_id)
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.status = TicketStatus.WON
    await db.commit()
    await db.refresh(ticket)
    return _ticket_to_out(ticket)


@router.post("/casino-eligibility", response_model=CasinoEligibilityResponse)
async def check_casino_eligibility(
    body: CasinoEligibilityCheck,
    db: AsyncSession = Depends(get_db),
):
    """
    Called by casino operator to check if an external player is eligible.
    In production this would verify against a casino play database.
    For the demo we check if the user exists with that external_player_id.
    """
    result = await db.execute(
        select(User).where(User.external_player_id == body.external_player_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        return CasinoEligibilityResponse(eligible=False, reason="Player not found")

    result = await db.execute(select(Lottery).where(Lottery.id == body.lottery_id))
    lottery = result.scalar_one_or_none()
    if not lottery:
        return CasinoEligibilityResponse(eligible=False, reason="Lottery not found")
    if lottery.status != LotteryStatus.ACTIVE:
        return CasinoEligibilityResponse(eligible=False, reason="Lottery not active")
    if not lottery.allow_casino_eligibility:
        return CasinoEligibilityResponse(eligible=False, reason="Casino eligibility not enabled")

    # Check if already has max entries
    count_result = await db.execute(
        select(func.count())
        .select_from(Ticket)
        .where(Ticket.lottery_id == body.lottery_id, Ticket.user_id == user.id)
    )
    if count_result.scalar() >= lottery.max_entries_per_user:
        return CasinoEligibilityResponse(eligible=False, reason="Max entries reached")

    # Auto-create ticket for eligible player
    ticket_code = _generate_ticket_code()
    qr_data = _generate_qr_data(ticket_code, body.lottery_id)
    qr_img = _make_qr_image(qr_data)

    ticket = Ticket(
        lottery_id=body.lottery_id,
        user_id=user.id,
        ticket_code=ticket_code,
        qr_code_data=qr_img,
        source=EntrySource.CASINO_PLAY,
        purchase_price=lottery.ticket_price,
        currency=lottery.currency,
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)

    result3 = await db.execute(
        select(Ticket).options(selectinload(Ticket.lottery), selectinload(Ticket.user))
        .where(Ticket.id == ticket.id)
    )
    ticket = result3.scalar_one()
    return CasinoEligibilityResponse(eligible=True, ticket=_ticket_to_out(ticket))
