import uuid
from datetime import datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, EmailStr, Field


# ── Enums ──────────────────────────────────────────────

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


# ── Auth ───────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: str
    role: UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=1, max_length=255)
    phone: str | None = None


# ── User ───────────────────────────────────────────────

class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    phone: str | None
    role: UserRole
    is_active: bool
    external_player_id: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    external_player_id: str | None = None


# ── Lottery ────────────────────────────────────────────

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


class PrizeTierCreate(BaseModel):
    tier_order: int = 1
    name: str
    description: str | None = None
    prize_value: Decimal = Decimal("0.00")
    currency: str = "EUR"
    winner_count: int = 1
    prize_type: str = "cash"


class PrizeTierOut(BaseModel):
    id: str
    lottery_id: str
    tier_order: int
    name: str
    description: str | None
    prize_value: Decimal
    currency: str
    winner_count: int
    prize_type: str

    model_config = {"from_attributes": True}


class LotteryCreate(BaseModel):
    name: str
    description: str | None = None
    lottery_type: LotteryType = LotteryType.RAFFLE
    status: LotteryStatus = LotteryStatus.DRAFT

    # Partner / Sync
    is_partner_managed: bool = False
    partner_id: str | None = None
    external_lottery_id: str | None = None
    partner_draw_url: str | None = None
    partner_entry_webhook: str | None = None

    # Timing
    start_date: datetime
    end_date: datetime
    draw_date: datetime | None = None
    is_recurring: bool = False
    recurrence_interval_hours: int | None = None

    # Entry Limits
    max_entries_per_user: int = 1
    max_entries_per_user_per_day: int | None = None
    max_entries_total: int | None = None
    max_entries_casino: int | None = None
    max_entries_direct: int | None = None
    max_entries_physical: int | None = None

    # Pricing
    ticket_price: Decimal = Decimal("0.00")
    currency: str = "EUR"
    ticket_price_casino: Decimal | None = None
    ticket_price_physical: Decimal | None = None
    bulk_discount_threshold: int | None = None
    bulk_discount_percent: Decimal | None = None

    # Casino Eligibility Channel
    allow_casino_eligibility: bool = False
    casino_online_enabled: bool = False
    casino_retail_enabled: bool = False
    casino_verification_method: CasinoVerificationMethod = CasinoVerificationMethod.API
    casino_min_play_amount: Decimal | None = None
    casino_eligible_games: str | None = None
    casino_eligibility_period_hours: int | None = None
    casino_iframe_url: str | None = None
    casino_redirect_url: str | None = None
    casino_require_player_card: bool = False
    casino_use_two_way_code: bool = False

    # Direct Purchase Channel
    allow_direct_purchase: bool = True
    direct_standalone_enabled: bool = True
    direct_iframe_enabled: bool = False
    direct_wallet_api_url: str | None = None
    direct_payment_provider: str | None = None
    direct_payment_methods: str | None = None

    # Physical Sales Channel
    allow_physical_sales: bool = True
    physical_pos_enabled: bool = True
    physical_printer_enabled: bool = False
    physical_qr_code_enabled: bool = True
    physical_ticket_code_length: int = 12
    physical_require_customer_id: bool = False

    # Game Layer
    game_layer_type: GameLayerType = GameLayerType.NONE
    game_layer_enabled: bool = False
    game_min_score: int = 0
    game_max_score: int = 100
    game_duration_seconds: int = 30
    game_entry_price: Decimal | None = None
    game_entries_per_win: int = 1
    game_target_lotteries: str | None = None
    game_layer_config: str | None = None

    # Draw Settings
    draw_mode: DrawMode = DrawMode.MANUAL
    draw_winner_count: int = 1
    draw_auto_complete: bool = True

    # Eligibility Rules
    min_age: int | None = None
    allowed_countries: str | None = None
    min_vip_level: int | None = None
    require_kyc: bool = False
    min_account_age_days: int | None = None

    # Display / Marketing
    prize_description: str | None = None
    brand_color: str | None = None
    banner_image_url: str | None = None
    terms_and_conditions: str | None = None
    show_countdown: bool = True
    show_entries_count: bool = True
    show_prize_pool: bool = True
    custom_css: str | None = None

    # Integration
    webhook_url: str | None = None
    callback_url: str | None = None

    # Coupon Entry
    coupon_entry_enabled: bool = False
    coupon_entry_rules: str | None = None

    # Prize Tiers
    prize_tiers: list[PrizeTierCreate] | None = None


class LotteryUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    lottery_type: LotteryType | None = None
    status: LotteryStatus | None = None

    # Partner / Sync
    is_partner_managed: bool | None = None
    partner_id: str | None = None
    external_lottery_id: str | None = None
    partner_draw_url: str | None = None
    partner_entry_webhook: str | None = None

    start_date: datetime | None = None
    end_date: datetime | None = None
    draw_date: datetime | None = None
    is_recurring: bool | None = None
    recurrence_interval_hours: int | None = None

    max_entries_per_user: int | None = None
    max_entries_per_user_per_day: int | None = None
    max_entries_total: int | None = None
    max_entries_casino: int | None = None
    max_entries_direct: int | None = None
    max_entries_physical: int | None = None

    ticket_price: Decimal | None = None
    currency: str | None = None
    ticket_price_casino: Decimal | None = None
    ticket_price_physical: Decimal | None = None
    bulk_discount_threshold: int | None = None
    bulk_discount_percent: Decimal | None = None

    allow_casino_eligibility: bool | None = None
    casino_online_enabled: bool | None = None
    casino_retail_enabled: bool | None = None
    casino_verification_method: CasinoVerificationMethod | None = None
    casino_min_play_amount: Decimal | None = None
    casino_eligible_games: str | None = None
    casino_eligibility_period_hours: int | None = None
    casino_iframe_url: str | None = None
    casino_redirect_url: str | None = None
    casino_require_player_card: bool | None = None
    casino_use_two_way_code: bool | None = None

    allow_direct_purchase: bool | None = None
    direct_standalone_enabled: bool | None = None
    direct_iframe_enabled: bool | None = None
    direct_wallet_api_url: str | None = None
    direct_payment_provider: str | None = None
    direct_payment_methods: str | None = None

    allow_physical_sales: bool | None = None
    physical_pos_enabled: bool | None = None
    physical_printer_enabled: bool | None = None
    physical_qr_code_enabled: bool | None = None
    physical_ticket_code_length: int | None = None
    physical_require_customer_id: bool | None = None

    game_layer_type: GameLayerType | None = None
    game_layer_enabled: bool | None = None
    game_min_score: int | None = None
    game_max_score: int | None = None
    game_duration_seconds: int | None = None
    game_entry_price: Decimal | None = None
    game_entries_per_win: int | None = None
    game_target_lotteries: str | None = None
    game_layer_config: str | None = None

    draw_mode: DrawMode | None = None
    draw_winner_count: int | None = None
    draw_auto_complete: bool | None = None

    min_age: int | None = None
    allowed_countries: str | None = None
    min_vip_level: int | None = None
    require_kyc: bool | None = None
    min_account_age_days: int | None = None

    prize_description: str | None = None
    brand_color: str | None = None
    banner_image_url: str | None = None
    terms_and_conditions: str | None = None
    show_countdown: bool | None = None
    show_entries_count: bool | None = None
    show_prize_pool: bool | None = None
    custom_css: str | None = None

    webhook_url: str | None = None
    callback_url: str | None = None

    coupon_entry_enabled: bool | None = None
    coupon_entry_rules: str | None = None

    prize_tiers: list[PrizeTierCreate] | None = None


class LotteryOut(BaseModel):
    id: str
    name: str
    description: str | None
    lottery_type: LotteryType
    status: LotteryStatus

    # Partner / Sync
    is_partner_managed: bool
    partner_id: str | None
    external_lottery_id: str | None
    partner_draw_url: str | None
    partner_entry_webhook: str | None
    last_synced_at: datetime | None

    start_date: datetime
    end_date: datetime
    draw_date: datetime | None
    is_recurring: bool
    recurrence_interval_hours: int | None

    max_entries_per_user: int
    max_entries_per_user_per_day: int | None
    max_entries_total: int | None
    max_entries_casino: int | None
    max_entries_direct: int | None
    max_entries_physical: int | None

    ticket_price: Decimal
    currency: str
    ticket_price_casino: Decimal | None
    ticket_price_physical: Decimal | None
    bulk_discount_threshold: int | None
    bulk_discount_percent: Decimal | None

    allow_casino_eligibility: bool
    casino_online_enabled: bool
    casino_retail_enabled: bool
    casino_verification_method: CasinoVerificationMethod
    casino_min_play_amount: Decimal | None
    casino_eligible_games: str | None
    casino_eligibility_period_hours: int | None
    casino_iframe_url: str | None
    casino_redirect_url: str | None
    casino_require_player_card: bool
    casino_use_two_way_code: bool

    allow_direct_purchase: bool
    direct_standalone_enabled: bool
    direct_iframe_enabled: bool
    direct_wallet_api_url: str | None
    direct_payment_provider: str | None
    direct_payment_methods: str | None

    allow_physical_sales: bool
    physical_pos_enabled: bool
    physical_printer_enabled: bool
    physical_qr_code_enabled: bool
    physical_ticket_code_length: int
    physical_require_customer_id: bool

    game_layer_type: GameLayerType
    game_layer_enabled: bool
    game_min_score: int
    game_max_score: int
    game_duration_seconds: int
    game_entry_price: Decimal | None
    game_entries_per_win: int
    game_target_lotteries: str | None
    game_layer_config: str | None

    draw_mode: DrawMode
    draw_winner_count: int
    draw_auto_complete: bool

    min_age: int | None
    allowed_countries: str | None
    min_vip_level: int | None
    require_kyc: bool
    min_account_age_days: int | None

    prize_description: str | None
    brand_color: str | None
    banner_image_url: str | None
    terms_and_conditions: str | None
    show_countdown: bool
    show_entries_count: bool
    show_prize_pool: bool
    custom_css: str | None

    webhook_url: str | None
    callback_url: str | None
    api_key: str | None

    coupon_entry_enabled: bool
    coupon_entry_rules: str | None

    created_at: datetime
    updated_at: datetime
    ticket_count: int = 0
    prize_tiers: list[PrizeTierOut] = []

    model_config = {"from_attributes": True}


# ── Ticket ─────────────────────────────────────────────

class TicketCreate(BaseModel):
    lottery_id: str
    source: EntrySource
    purchase_price: Decimal | None = None
    currency: str | None = None


class TicketValidate(BaseModel):
    ticket_code: str


class TicketOut(BaseModel):
    id: str
    lottery_id: str
    user_id: str
    ticket_code: str
    qr_code_data: str | None
    source: EntrySource
    status: TicketStatus
    purchase_price: Decimal
    currency: str
    created_at: datetime
    validated_at: datetime | None
    lottery_name: str | None = None
    user_name: str | None = None

    model_config = {"from_attributes": True}


class CasinoEligibilityCheck(BaseModel):
    external_player_id: str
    lottery_id: str


class CasinoEligibilityResponse(BaseModel):
    eligible: bool
    ticket: TicketOut | None = None
    reason: str | None = None


# ── Transaction ────────────────────────────────────────

class TransactionOut(BaseModel):
    id: str
    user_id: str
    ticket_id: str | None
    amount: Decimal
    currency: str
    status: TransactionStatus
    payment_method: str | None
    external_ref: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Stats / Reporting ──────────────────────────────────

class LotteryStats(BaseModel):
    lottery_id: str
    lottery_name: str
    total_tickets: int
    tickets_by_source: dict[str, int]
    tickets_by_status: dict[str, int]
    total_revenue: Decimal
    unique_participants: int


class DashboardStats(BaseModel):
    active_lotteries: int
    total_tickets_today: int
    total_revenue_today: Decimal
    total_users: int
    recent_tickets: list[TicketOut]


# ── Draw ───────────────────────────────────────────────

class DrawRequest(BaseModel):
    lottery_id: str
    winner_count: int = 1


class DrawResult(BaseModel):
    lottery_id: str
    lottery_name: str
    winners: list[TicketOut]
    drawn_at: datetime


# ── Game Session ───────────────────────────────────────

class GameSessionStatus(str, Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    QUALIFIED = "qualified"
    FAILED = "failed"
    EXPIRED = "expired"


class GameStartRequest(BaseModel):
    lottery_id: str


class GameSubmitScore(BaseModel):
    session_id: str
    score: int


class GameSessionOut(BaseModel):
    id: str
    user_id: str
    lottery_id: str
    game_type: GameLayerType
    status: GameSessionStatus
    score: int | None
    min_score_required: int
    max_score: int
    duration_seconds: int
    entry_price_paid: Decimal
    tickets_awarded: int
    target_lotteries: str | None
    started_at: datetime
    completed_at: datetime | None
    qualified: bool = False
    tickets_created: list[TicketOut] = []

    model_config = {"from_attributes": True}


# ── Reporting ─────────────────────────────────────────

class ReportFilter(BaseModel):
    start_date: datetime | None = None
    end_date: datetime | None = None
    lottery_id: str | None = None
    source: EntrySource | None = None
    status: TicketStatus | None = None


class RevenueReport(BaseModel):
    total_revenue: Decimal
    revenue_by_day: list[dict]
    revenue_by_source: dict[str, Decimal]
    revenue_by_lottery: list[dict]


class EntryReport(BaseModel):
    total_entries: int
    entries_by_day: list[dict]
    entries_by_source: dict[str, int]
    entries_by_lottery: list[dict]
    conversion_rate: float  # game sessions that qualified


# ── Marketing Widget ───────────────────────────────────

class WidgetConfig(BaseModel):
    lottery_id: str
    theme: str = "light"
    show_countdown: bool = True
    show_ticket_count: bool = True
    cta_text: str = "Enter Now"
    cta_url: str | None = None


class WidgetMode(str, Enum):
    STANDALONE = "standalone"
    IFRAME = "iframe"
    POPUP = "popup"
    EMBEDDED = "embedded"


# ── Coupons ─────────────────────────────────────────────

class CouponTier(str, Enum):
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"


class CouponStatus(str, Enum):
    ACTIVE = "active"
    REDEEMED = "redeemed"
    EXPIRED = "expired"
    VOID = "void"


class CouponOut(BaseModel):
    id: str
    user_id: str
    tier: CouponTier
    status: CouponStatus
    source: str
    source_ref: str | None = None
    lottery_id: str | None = None
    expires_at: datetime | None = None
    redeemed_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CouponCreate(BaseModel):
    user_id: str
    tier: CouponTier
    source: str = "casino_play"
    source_ref: str | None = None
    lottery_id: str | None = None
    expires_at: datetime | None = None


class CouponRedeem(BaseModel):
    lottery_id: str
    coupons: list[str]  # list of coupon IDs to redeem


class CouponEntryRule(BaseModel):
    tier: CouponTier
    count: int = 1  # how many coupons of this tier = 1 entry


# ── Partner Config ──────────────────────────────────────

class PartnerConfigOut(BaseModel):
    id: str
    name: str
    partner_type: str
    is_active: bool
    api_base_url: str | None = None
    api_key: str | None = None
    wallet_api_url: str | None = None
    wallet_provider: str | None = None
    payment_provider: str | None = None
    payment_methods: str | None = None
    payment_webhook_url: str | None = None
    casino_player_verification_url: str | None = None
    casino_game_list_url: str | None = None
    casino_external_id_prefix: str | None = None
    coupon_issuance_enabled: bool = False
    coupon_issuance_rules: str | None = None
    gamification_enabled: bool = False
    sync_enabled: bool = False
    sync_direction: str | None = None
    sync_lottery_endpoint: str | None = None
    sync_interval_minutes: int | None = None
    last_synced_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PartnerConfigCreate(BaseModel):
    name: str
    partner_type: str = "casino"
    is_active: bool = True
    api_base_url: str | None = None
    api_key: str | None = None
    api_secret: str | None = None
    webhook_secret: str | None = None
    wallet_api_url: str | None = None
    wallet_provider: str | None = None
    payment_provider: str | None = None
    payment_methods: str | None = None
    payment_webhook_url: str | None = None
    casino_player_verification_url: str | None = None
    casino_game_list_url: str | None = None
    casino_external_id_prefix: str | None = None
    coupon_issuance_enabled: bool = False
    coupon_issuance_rules: str | None = None
    gamification_enabled: bool = False
    sync_enabled: bool = False
    sync_direction: str | None = None
    sync_lottery_endpoint: str | None = None
    sync_interval_minutes: int | None = None


class PartnerConfigUpdate(BaseModel):
    name: str | None = None
    partner_type: str | None = None
    is_active: bool | None = None
    api_base_url: str | None = None
    api_key: str | None = None
    api_secret: str | None = None
    webhook_secret: str | None = None
    wallet_api_url: str | None = None
    wallet_provider: str | None = None
    payment_provider: str | None = None
    payment_methods: str | None = None
    payment_webhook_url: str | None = None
    casino_player_verification_url: str | None = None
    casino_game_list_url: str | None = None
    casino_external_id_prefix: str | None = None
    coupon_issuance_enabled: bool | None = None
    coupon_issuance_rules: str | None = None
    gamification_enabled: bool | None = None
    sync_enabled: bool | None = None
    sync_direction: str | None = None
    sync_lottery_endpoint: str | None = None
    sync_interval_minutes: int | None = None
