"""
Seed script: creates demo admin, POS operator, player, and a sample lottery.
Run: python -m app.seed
"""
import asyncio
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select

from app.auth import hash_password
from app.database import Base, async_session, engine
from app.models import (
    Coupon,
    CouponTier,
    GameLayerType,
    Lottery,
    LotteryStatus,
    LotteryType,
    PartnerConfig,
    PrizeTier,
    User,
    UserRole,
)


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        # Check if already seeded
        result = await db.execute(select(User).where(User.email == "admin@lottery.demo"))
        if result.scalar_one_or_none():
            print("Already seeded. Skipping.")
            return

        # Admin
        admin = User(
            email="admin@lottery.demo",
            password_hash=hash_password("admin123"),
            full_name="Admin User",
            role=UserRole.ADMIN,
        )
        db.add(admin)

        # POS Operator
        pos = User(
            email="pos@lottery.demo",
            password_hash=hash_password("pos123"),
            full_name="POS Operator",
            role=UserRole.POS_OPERATOR,
        )
        db.add(pos)

        # Demo Player
        player = User(
            email="player@lottery.demo",
            password_hash=hash_password("player123"),
            full_name="Demo Player",
            phone="+1234567890",
            external_player_id="CASINO_PLAYER_001",
        )
        db.add(player)
        await db.flush()

        now = datetime.now(timezone.utc)

        # ── 1. Grand Cash Draw ──────────────────────────────────────────────
        l1 = Lottery(
            name="Grand Cash Draw",
            description="Our flagship monthly raffle with a life-changing €50,000 top prize. Buy your ticket now for just €5 and join thousands of players competing for the biggest jackpot of the season.",
            lottery_type=LotteryType.RAFFLE,
            start_date=now,
            end_date=now + timedelta(days=28),
            draw_date=now + timedelta(days=29),
            status=LotteryStatus.ACTIVE,
            max_entries_per_user=10,
            ticket_price=Decimal("5.00"),
            currency="EUR",
            bulk_discount_threshold=5,
            bulk_discount_percent=Decimal("10.00"),
            allow_casino_eligibility=True,
            allow_direct_purchase=True,
            allow_physical_sales=True,
            direct_standalone_enabled=True,
            direct_iframe_enabled=True,
            prize_description="€50,000 Grand Prize",
            brand_color="#6366f1",
            banner_image_url="https://images.unsplash.com/photo-1607863680198-23d4b2565df0?w=1200&h=400&fit=crop",
            show_countdown=True,
            show_entries_count=True,
            show_prize_pool=True,
            min_age=18,
            terms_and_conditions="Open to residents aged 18+. One draw per calendar month. Winners notified by email within 48 hours of draw.",
        )
        db.add(l1)
        await db.flush()
        db.add(PrizeTier(lottery_id=l1.id, tier_order=1, name="🥇 Grand Prize", description="€50,000 cash transfer", prize_value=Decimal("50000.00"), winner_count=1, prize_type="cash"))
        db.add(PrizeTier(lottery_id=l1.id, tier_order=2, name="🥈 Second Prize", description="€10,000 cash", prize_value=Decimal("10000.00"), winner_count=2, prize_type="cash"))
        db.add(PrizeTier(lottery_id=l1.id, tier_order=3, name="🥉 Third Prize", description="€2,500 bonus credit", prize_value=Decimal("2500.00"), winner_count=5, prize_type="bonus"))
        db.add(PrizeTier(lottery_id=l1.id, tier_order=4, name="Consolation", description="€100 free bet", prize_value=Decimal("100.00"), winner_count=20, prize_type="freebet"))

        # ── 2. Weekly Free Raffle ───────────────────────────────────────────
        l2 = Lottery(
            name="Weekend Free Raffle",
            description="Every weekend we give away €500 to one lucky player — absolutely free. No purchase necessary. Simply claim your free entry and you're in the draw!",
            lottery_type=LotteryType.RAFFLE,
            start_date=now,
            end_date=now + timedelta(days=4),
            draw_date=now + timedelta(days=5),
            status=LotteryStatus.ACTIVE,
            is_recurring=True,
            recurrence_interval_hours=168,
            max_entries_per_user=1,
            ticket_price=Decimal("0.00"),
            currency="EUR",
            allow_casino_eligibility=True,
            allow_direct_purchase=True,
            allow_physical_sales=False,
            direct_standalone_enabled=True,
            direct_iframe_enabled=True,
            prize_description="€500 Bonus Credit",
            brand_color="#10b981",
            banner_image_url="https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1200&h=400&fit=crop",
            show_countdown=True,
            show_entries_count=True,
            show_prize_pool=False,
            min_age=18,
            terms_and_conditions="One free entry per registered account per week. Bonus credit subject to 5x wagering requirement.",
        )
        db.add(l2)
        await db.flush()
        db.add(PrizeTier(lottery_id=l2.id, tier_order=1, name="Weekly Winner", description="€500 bonus credit", prize_value=Decimal("500.00"), winner_count=1, prize_type="bonus"))

        # ── 3. Sports Car Lottery ───────────────────────────────────────────
        l3 = Lottery(
            name="Drive Away in Style",
            description="Win a brand-new Porsche 911 Carrera worth over €120,000 — or take the €100,000 cash alternative. Tickets are just €25. Only 5,000 tickets available, so act fast before they sell out!",
            lottery_type=LotteryType.RAFFLE,
            start_date=now,
            end_date=now + timedelta(days=60),
            draw_date=now + timedelta(days=61),
            status=LotteryStatus.ACTIVE,
            max_entries_per_user=20,
            max_entries_total=5000,
            ticket_price=Decimal("25.00"),
            currency="EUR",
            allow_casino_eligibility=True,
            allow_direct_purchase=True,
            allow_physical_sales=True,
            direct_standalone_enabled=True,
            prize_description="Porsche 911 or €100k Cash",
            brand_color="#ef4444",
            banner_image_url="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&h=400&fit=crop",
            show_countdown=True,
            show_entries_count=True,
            show_prize_pool=True,
            min_age=18,
            require_kyc=True,
            terms_and_conditions="Winner must be 18+ and hold a valid driving licence. Cash alternative of €100,000 available. Draw held live on our YouTube channel.",
        )
        db.add(l3)
        await db.flush()
        db.add(PrizeTier(lottery_id=l3.id, tier_order=1, name="🚗 Porsche 911", description="Brand new Porsche 911 Carrera (or €100k cash)", prize_value=Decimal("120000.00"), winner_count=1, prize_type="physical"))
        db.add(PrizeTier(lottery_id=l3.id, tier_order=2, name="Runner Up", description="€5,000 cash", prize_value=Decimal("5000.00"), winner_count=3, prize_type="cash"))

        # ── 4. Tap Attack Challenge (Game Layer + Coupon) ───────────────────
        l4 = Lottery(
            name="Tap Attack Challenge",
            description="Play our addictive Tap Attack mini-game for just €1 per session. Score 50 or more points in 30 seconds to earn a raffle entry. You can also redeem your casino coupons for free entries!",
            lottery_type=LotteryType.DRAW,
            start_date=now,
            end_date=now + timedelta(days=14),
            draw_date=now + timedelta(days=15),
            status=LotteryStatus.ACTIVE,
            max_entries_per_user=10,
            ticket_price=Decimal("2.00"),
            currency="EUR",
            allow_direct_purchase=True,
            allow_physical_sales=False,
            allow_casino_eligibility=False,
            game_layer_enabled=True,
            game_layer_type=GameLayerType.SPIN_WHEEL,
            game_min_score=50,
            game_max_score=100,
            game_duration_seconds=30,
            game_entry_price=Decimal("1.00"),
            game_entries_per_win=1,
            coupon_entry_enabled=True,
            coupon_entry_rules='[{"tier":"gold","count":1},{"tier":"silver","count":2},{"tier":"bronze","count":3}]',
            prize_description="€5,000 + PlayStation 5",
            brand_color="#8b5cf6",
            banner_image_url="https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&h=400&fit=crop",
            show_countdown=True,
            show_entries_count=True,
            show_prize_pool=True,
            min_age=18,
            terms_and_conditions="Game sessions cost €1 each. Score 50/100 or higher to earn an entry. Alternatively redeem: 1× Gold, 2× Silver, or 3× Bronze coupon for a free entry.",
        )
        db.add(l4)
        await db.flush()
        db.add(PrizeTier(lottery_id=l4.id, tier_order=1, name="🎮 Grand Prize", description="PlayStation 5 + €5,000 cash", prize_value=Decimal("5000.00"), winner_count=1, prize_type="physical"))
        db.add(PrizeTier(lottery_id=l4.id, tier_order=2, name="Runner Up", description="€20 free bet credit", prize_value=Decimal("20.00"), winner_count=10, prize_type="freebet"))

        # ── 5. VIP Casino Raffle ────────────────────────────────────────────
        l5 = Lottery(
            name="VIP High Roller Raffle",
            description="Exclusively for our VIP casino players. Wager €50 or more at eligible games and automatically earn a free entry into this exclusive monthly draw with a €25,000 luxury prize package.",
            lottery_type=LotteryType.RAFFLE,
            start_date=now,
            end_date=now + timedelta(days=30),
            draw_date=now + timedelta(days=31),
            status=LotteryStatus.ACTIVE,
            max_entries_per_user=5,
            ticket_price=Decimal("0.00"),
            currency="EUR",
            allow_casino_eligibility=True,
            casino_online_enabled=True,
            casino_retail_enabled=True,
            casino_verification_method="api",
            casino_min_play_amount=Decimal("50.00"),
            casino_eligibility_period_hours=24,
            casino_eligible_games="slots,blackjack,roulette,baccarat",
            allow_direct_purchase=False,
            allow_physical_sales=False,
            coupon_entry_enabled=True,
            coupon_entry_rules='[{"tier":"gold","count":1}]',
            prize_description="€25,000 Luxury VIP Package",
            min_vip_level=2,
            brand_color="#f59e0b",
            banner_image_url="https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=1200&h=400&fit=crop",
            show_countdown=True,
            show_entries_count=False,
            show_prize_pool=True,
            min_age=21,
            require_kyc=True,
            terms_and_conditions="Exclusive to VIP Level 2+ players. Eligibility based on wagers placed in the 24 hours preceding entry. Luxury package includes 5-star hotel stay, flights and spending money.",
        )
        db.add(l5)
        await db.flush()
        db.add(PrizeTier(lottery_id=l5.id, tier_order=1, name="🌟 VIP Package", description="5-star Maldives resort + €15k cash + flights", prize_value=Decimal("25000.00"), winner_count=1, prize_type="physical"))
        db.add(PrizeTier(lottery_id=l5.id, tier_order=2, name="Premium Prize", description="€2,000 casino bonus", prize_value=Decimal("2000.00"), winner_count=2, prize_type="bonus"))

        # ── 6. Holiday Dream Draw ───────────────────────────────────────────
        l6 = Lottery(
            name="Holiday Dream Draw",
            description="Win the ultimate all-inclusive holiday for two — flights, 5-star hotel, and €2,000 spending money included. Tickets just €10 each, max 5 per player.",
            lottery_type=LotteryType.RAFFLE,
            start_date=now,
            end_date=now + timedelta(days=21),
            draw_date=now + timedelta(days=22),
            status=LotteryStatus.ACTIVE,
            max_entries_per_user=5,
            ticket_price=Decimal("10.00"),
            currency="EUR",
            allow_casino_eligibility=True,
            allow_direct_purchase=True,
            allow_physical_sales=True,
            direct_standalone_enabled=True,
            direct_iframe_enabled=True,
            prize_description="All-Inclusive Holiday for 2",
            brand_color="#0ea5e9",
            banner_image_url="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=400&fit=crop",
            show_countdown=True,
            show_entries_count=True,
            show_prize_pool=True,
            min_age=18,
            terms_and_conditions="Prize includes return flights (economy class) for two, 7 nights 5-star accommodation, and €2,000 spending money. Travel must be taken within 12 months of draw date.",
        )
        db.add(l6)
        await db.flush()
        db.add(PrizeTier(lottery_id=l6.id, tier_order=1, name="✈️ Dream Holiday", description="All-inclusive holiday for 2 + €2k spending money", prize_value=Decimal("8000.00"), winner_count=1, prize_type="physical"))
        db.add(PrizeTier(lottery_id=l6.id, tier_order=2, name="Weekend Escape", description="Weekend city break for 2", prize_value=Decimal("1500.00"), winner_count=3, prize_type="physical"))
        db.add(PrizeTier(lottery_id=l6.id, tier_order=3, name="Travel Voucher", description="€200 travel voucher", prize_value=Decimal("200.00"), winner_count=10, prize_type="physical"))

        # ── 7. Tech Bonanza ─────────────────────────────────────────────────
        l7 = Lottery(
            name="Tech Bonanza",
            description="The ultimate tech raffle — win the latest Apple gear, gaming setups, and smart home bundles. Multiple winners every week. Tickets from just €3.",
            lottery_type=LotteryType.RAFFLE,
            start_date=now,
            end_date=now + timedelta(days=10),
            draw_date=now + timedelta(days=11),
            status=LotteryStatus.ACTIVE,
            max_entries_per_user=15,
            ticket_price=Decimal("3.00"),
            currency="EUR",
            bulk_discount_threshold=5,
            bulk_discount_percent=Decimal("15.00"),
            allow_casino_eligibility=True,
            allow_direct_purchase=True,
            allow_physical_sales=True,
            direct_standalone_enabled=True,
            direct_iframe_enabled=True,
            game_layer_enabled=True,
            game_layer_type=GameLayerType.SCRATCH_CARD,
            game_min_score=1,
            game_max_score=3,
            game_duration_seconds=10,
            game_entry_price=Decimal("0.50"),
            game_entries_per_win=1,
            prize_description="MacBook Pro + iPhone 16 + More",
            brand_color="#3b82f6",
            banner_image_url="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&h=400&fit=crop",
            show_countdown=True,
            show_entries_count=True,
            show_prize_pool=True,
            min_age=18,
            terms_and_conditions="All prizes are brand new and include manufacturer warranty. Winners selected by certified random number generator.",
        )
        db.add(l7)
        await db.flush()
        db.add(PrizeTier(lottery_id=l7.id, tier_order=1, name="💻 MacBook Pro", description="MacBook Pro M4 16-inch + iPhone 16 Pro", prize_value=Decimal("4500.00"), winner_count=1, prize_type="physical"))
        db.add(PrizeTier(lottery_id=l7.id, tier_order=2, name="🎮 Gaming Setup", description="PS5 + 4K gaming monitor + headset", prize_value=Decimal("2000.00"), winner_count=2, prize_type="physical"))
        db.add(PrizeTier(lottery_id=l7.id, tier_order=3, name="📱 iPhone 16 Pro", description="iPhone 16 Pro 256GB", prize_value=Decimal("1200.00"), winner_count=5, prize_type="physical"))
        db.add(PrizeTier(lottery_id=l7.id, tier_order=4, name="🎧 AirPods Max", description="Apple AirPods Max", prize_value=Decimal("550.00"), winner_count=10, prize_type="physical"))

        # Demo Partner Config
        partner = PartnerConfig(
            name="Demo Casino Partner",
            partner_type="casino",
            is_active=True,
            api_base_url="https://api.demo-casino.com/v1",
            api_key="demo_api_key_123",
            wallet_api_url="https://wallet.demo-casino.com/api",
            wallet_provider="demo_wallet",
            payment_provider="stripe",
            payment_methods='["card","apple_pay","google_pay"]',
            payment_webhook_url="https://api.demo-casino.com/webhooks/payment",
            casino_player_verification_url="https://api.demo-casino.com/players/verify",
            casino_game_list_url="https://api.demo-casino.com/games",
            casino_external_id_prefix="CASINO_",
            coupon_issuance_enabled=True,
            coupon_issuance_rules='{"bronze":{"min_play":10,"games":["slots"]},"silver":{"min_play":50,"games":["slots","blackjack"]},"gold":{"min_play":100,"games":["slots","blackjack","roulette"]}}',
            gamification_enabled=True,
            sync_enabled=True,
            sync_direction="pull",
            sync_lottery_endpoint="https://api.demo-casino.com/lotteries",
            sync_interval_minutes=60,
        )
        db.add(partner)

        # Give demo player some coupons
        db.add(Coupon(user_id=player.id, tier=CouponTier.GOLD, source="casino_play", source_ref="high_roller_bonus"))
        db.add(Coupon(user_id=player.id, tier=CouponTier.SILVER, source="casino_play"))
        db.add(Coupon(user_id=player.id, tier=CouponTier.SILVER, source="casino_play"))
        db.add(Coupon(user_id=player.id, tier=CouponTier.BRONZE, source="promotion"))
        db.add(Coupon(user_id=player.id, tier=CouponTier.BRONZE, source="promotion"))
        db.add(Coupon(user_id=player.id, tier=CouponTier.BRONZE, source="promotion"))

        await db.commit()
        print("Seed data created!")
        print("  Admin:  admin@lottery.demo / admin123")
        print("  POS:    pos@lottery.demo / pos123")
        print("  Player: player@lottery.demo / player123")


if __name__ == "__main__":
    asyncio.run(seed())
