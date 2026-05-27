import uuid
from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class UserRole(str, Enum):
    PLAYER = "player"
    ADMIN = "admin"
    POS_OPERATOR = "pos_operator"


class LotteryStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class EntrySource(str, Enum):
    CASINO_PLAY = "casino_play"
    DIRECT_PURCHASE = "direct_purchase"
    PHYSICAL_SALE = "physical_sale"
    COUPON_REDEMPTION = "coupon_redemption"
    GAME_WIN = "game_win"


class TicketStatus(str, Enum):
    ACTIVE = "active"
    CHECKED = "checked"
    WON = "won"
    LOST = "lost"
    VOID = "void"


class TransactionStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), default=UserRole.PLAYER, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    external_player_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    tickets: Mapped[list["Ticket"]] = relationship(back_populates="user", lazy="selectin")
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="user", lazy="selectin")
    coupons: Mapped[list["Coupon"]] = relationship(back_populates="user", lazy="selectin")


class LotteryType(str, Enum):
    RAFFLE = "raffle"
    INSTANT_WIN = "instant_win"
    DRAW = "draw"


class DrawMode(str, Enum):
    MANUAL = "manual"
    AUTOMATIC = "automatic"
    SCHEDULED = "scheduled"


class CasinoVerificationMethod(str, Enum):
    API = "api"
    IFRAME = "iframe"
    REDIRECT = "redirect"
    PLAYER_CARD = "player_card"


class GameLayerType(str, Enum):
    NONE = "none"
    SPIN_WHEEL = "spin_wheel"
    SCRATCH_CARD = "scratch_card"
    PICK_NUMBER = "pick_number"
    SLOT_SPIN = "slot_spin"


class CouponTier(str, Enum):
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"


class CouponStatus(str, Enum):
    ACTIVE = "active"
    REDEEMED = "redeemed"
    EXPIRED = "expired"
    VOID = "void"


class Lottery(Base):
    __tablename__ = "lotteries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    lottery_type: Mapped[LotteryType] = mapped_column(SAEnum(LotteryType), default=LotteryType.RAFFLE)
    status: Mapped[LotteryStatus] = mapped_column(SAEnum(LotteryStatus), default=LotteryStatus.DRAFT)

    # ── Partner / Sync origin ─────────────────────────
    # When True this lottery is owned by the partner — we only manage entry
    # channels and gamification. Draw, timing and results come from them.
    is_partner_managed: Mapped[bool] = mapped_column(Boolean, default=False)
    partner_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("partner_configs.id"), nullable=True, index=True)
    external_lottery_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    partner_draw_url: Mapped[str | None] = mapped_column(String(500), nullable=True)  # URL to results page on partner
    partner_entry_webhook: Mapped[str | None] = mapped_column(String(500), nullable=True)  # we POST entries here
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # ── Timing ────────────────────────────────────────
    # For partner-managed lotteries these come from the partner sync and are
    # display-only. We never trigger a draw ourselves.
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    draw_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    recurrence_interval_hours: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # ── Entry Limits ──────────────────────────────────
    max_entries_per_user: Mapped[int] = mapped_column(Integer, default=1)
    max_entries_per_user_per_day: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_entries_total: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_entries_casino: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_entries_direct: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_entries_physical: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # ── Pricing ───────────────────────────────────────
    ticket_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"))
    currency: Mapped[str] = mapped_column(String(3), default="EUR")
    ticket_price_casino: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    ticket_price_physical: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    bulk_discount_threshold: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bulk_discount_percent: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)

    # ── Channel: Casino Eligibility ───────────────────
    allow_casino_eligibility: Mapped[bool] = mapped_column(Boolean, default=False)
    casino_online_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    casino_retail_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    casino_verification_method: Mapped[CasinoVerificationMethod] = mapped_column(
        SAEnum(CasinoVerificationMethod), default=CasinoVerificationMethod.API
    )
    casino_min_play_amount: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    casino_eligible_games: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON list
    casino_eligibility_period_hours: Mapped[int | None] = mapped_column(Integer, nullable=True)
    casino_iframe_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    casino_redirect_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    casino_require_player_card: Mapped[bool] = mapped_column(Boolean, default=False)
    casino_use_two_way_code: Mapped[bool] = mapped_column(Boolean, default=False)

    # ── Channel: Direct Purchase ──────────────────────
    allow_direct_purchase: Mapped[bool] = mapped_column(Boolean, default=True)
    direct_standalone_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    direct_iframe_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    direct_wallet_api_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    direct_payment_provider: Mapped[str | None] = mapped_column(String(100), nullable=True)
    direct_payment_methods: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON list

    # ── Channel: Physical Sales ───────────────────────
    allow_physical_sales: Mapped[bool] = mapped_column(Boolean, default=True)
    physical_pos_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    physical_printer_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    physical_qr_code_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    physical_ticket_code_length: Mapped[int] = mapped_column(Integer, default=12)
    physical_require_customer_id: Mapped[bool] = mapped_column(Boolean, default=False)

    # ── Game Layer ────────────────────────────────────
    game_layer_type: Mapped[GameLayerType] = mapped_column(SAEnum(GameLayerType), default=GameLayerType.NONE)
    game_layer_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    game_min_score: Mapped[int] = mapped_column(Integer, default=0)
    game_max_score: Mapped[int] = mapped_column(Integer, default=100)
    game_duration_seconds: Mapped[int] = mapped_column(Integer, default=30)
    game_entry_price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    game_entries_per_win: Mapped[int] = mapped_column(Integer, default=1)
    game_target_lotteries: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON: list of lottery IDs or "all"
    game_layer_config: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON extra config

    # ── Draw Settings ─────────────────────────────────
    draw_mode: Mapped[DrawMode] = mapped_column(SAEnum(DrawMode), default=DrawMode.MANUAL)
    draw_winner_count: Mapped[int] = mapped_column(Integer, default=1)
    draw_auto_complete: Mapped[bool] = mapped_column(Boolean, default=True)

    # ── Eligibility Rules ─────────────────────────────
    min_age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    allowed_countries: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON list
    min_vip_level: Mapped[int | None] = mapped_column(Integer, nullable=True)
    require_kyc: Mapped[bool] = mapped_column(Boolean, default=False)
    min_account_age_days: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # ── Display / Marketing ───────────────────────────
    prize_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    brand_color: Mapped[str | None] = mapped_column(String(7), nullable=True)
    banner_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    terms_and_conditions: Mapped[str | None] = mapped_column(Text, nullable=True)
    show_countdown: Mapped[bool] = mapped_column(Boolean, default=True)
    show_entries_count: Mapped[bool] = mapped_column(Boolean, default=True)
    show_prize_pool: Mapped[bool] = mapped_column(Boolean, default=True)
    custom_css: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Integration / Webhooks ────────────────────────
    webhook_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    callback_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    api_key: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # ── Coupon Entry Requirements ─────────────────────
    coupon_entry_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    # JSON: [{"tier":"gold","count":1},{"tier":"silver","count":2},{"tier":"bronze","count":3}]
    coupon_entry_rules: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Timestamps ────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    partner: Mapped["PartnerConfig | None"] = relationship(back_populates="lotteries", foreign_keys="Lottery.partner_id", lazy="select")
    tickets: Mapped[list["Ticket"]] = relationship(back_populates="lottery", lazy="selectin")
    prize_tiers: Mapped[list["PrizeTier"]] = relationship(back_populates="lottery", lazy="selectin", cascade="all, delete-orphan")


class PrizeTier(Base):
    __tablename__ = "prize_tiers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lottery_id: Mapped[str] = mapped_column(String(36), ForeignKey("lotteries.id"), nullable=False, index=True)
    tier_order: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    prize_value: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"))
    currency: Mapped[str] = mapped_column(String(3), default="EUR")
    winner_count: Mapped[int] = mapped_column(Integer, default=1)
    prize_type: Mapped[str] = mapped_column(String(50), default="cash")  # cash, bonus, physical, freebet

    lottery: Mapped["Lottery"] = relationship(back_populates="prize_tiers")


class Ticket(Base):
    __tablename__ = "tickets"
    __table_args__ = (
        UniqueConstraint("lottery_id", "ticket_code", name="uq_ticket_code_per_lottery"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lottery_id: Mapped[str] = mapped_column(String(36), ForeignKey("lotteries.id"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    ticket_code: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    qr_code_data: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[EntrySource] = mapped_column(SAEnum(EntrySource), nullable=False)
    status: Mapped[TicketStatus] = mapped_column(SAEnum(TicketStatus), default=TicketStatus.ACTIVE)
    purchase_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"))
    currency: Mapped[str] = mapped_column(String(3), default="EUR")
    metadata_: Mapped[str | None] = mapped_column("metadata", Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    validated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    lottery: Mapped["Lottery"] = relationship(back_populates="tickets")
    user: Mapped["User"] = relationship(back_populates="tickets")
    transaction: Mapped["Transaction | None"] = relationship(back_populates="ticket", uselist=False)


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    ticket_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("tickets.id"), nullable=True, unique=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="EUR")
    status: Mapped[TransactionStatus] = mapped_column(SAEnum(TransactionStatus), default=TransactionStatus.PENDING)
    payment_method: Mapped[str | None] = mapped_column(String(50), nullable=True)
    external_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped["User"] = relationship(back_populates="transactions")
    ticket: Mapped["Ticket | None"] = relationship(back_populates="transaction")


class GameSessionStatus(str, Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    QUALIFIED = "qualified"
    FAILED = "failed"
    EXPIRED = "expired"


class GameSession(Base):
    __tablename__ = "game_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    lottery_id: Mapped[str] = mapped_column(String(36), ForeignKey("lotteries.id"), nullable=False, index=True)
    game_type: Mapped[GameLayerType] = mapped_column(SAEnum(GameLayerType), nullable=False)
    status: Mapped[GameSessionStatus] = mapped_column(SAEnum(GameSessionStatus), default=GameSessionStatus.IN_PROGRESS)
    score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    min_score_required: Mapped[int] = mapped_column(Integer, default=0)
    max_score: Mapped[int] = mapped_column(Integer, default=100)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=30)
    entry_price_paid: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"))
    tickets_awarded: Mapped[int] = mapped_column(Integer, default=0)
    target_lotteries: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON list of lottery IDs awarded to
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship()
    lottery: Mapped["Lottery"] = relationship()


class Coupon(Base):
    __tablename__ = "coupons"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    tier: Mapped[CouponTier] = mapped_column(SAEnum(CouponTier), nullable=False)
    status: Mapped[CouponStatus] = mapped_column(SAEnum(CouponStatus), default=CouponStatus.ACTIVE)
    source: Mapped[str] = mapped_column(String(50), default="casino_play")  # casino_play, promotion, purchase, gift
    source_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)
    lottery_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("lotteries.id"), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    redeemed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped["User"] = relationship(back_populates="coupons")
    lottery: Mapped["Lottery | None"] = relationship()


class PartnerConfig(Base):
    __tablename__ = "partner_configs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    partner_type: Mapped[str] = mapped_column(String(50), default="casino")  # casino, retail, online
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # API Integration
    api_base_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    api_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    api_secret: Mapped[str | None] = mapped_column(String(255), nullable=True)
    webhook_secret: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Wallet / Payment
    wallet_api_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    wallet_provider: Mapped[str | None] = mapped_column(String(100), nullable=True)
    payment_provider: Mapped[str | None] = mapped_column(String(100), nullable=True)
    payment_methods: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON list
    payment_webhook_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Casino specific
    casino_player_verification_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    casino_game_list_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    casino_external_id_prefix: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Coupon / Gamification
    coupon_issuance_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    coupon_issuance_rules: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON: rules for awarding coupons
    gamification_enabled: Mapped[bool] = mapped_column(Boolean, default=False)

    # Sync
    sync_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    sync_direction: Mapped[str | None] = mapped_column(String(20), nullable=True)  # pull, push, bidirectional
    sync_lottery_endpoint: Mapped[str | None] = mapped_column(String(500), nullable=True)
    sync_interval_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    lotteries: Mapped[list["Lottery"]] = relationship(back_populates="partner", foreign_keys="Lottery.partner_id", lazy="select")
