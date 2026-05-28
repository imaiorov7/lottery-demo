# Lottery Demo System

Full MVP demo system for a lottery/raffle platform with a unified frontend combining Player, Admin Backoffice, and POS Terminal portals.

## Quick Start

```bash
docker compose up --build
```

Open **http://localhost:5173** and log in.

## Architecture

```
lottery_demo/
  backend/       FastAPI + SQLAlchemy + PostgreSQL
  frontend/      Unified React app (Player + Admin + POS)
```

Single frontend at port **5173** with three portals:
- `/player` — Buy tickets, play games, redeem coupons
- `/admin` — Manage lotteries, view reports, run draws
- `/pos` — Sell physical tickets, validate entries

## Demo Account

| Email | Password |
|-------|----------|
| admin@lottery.demo | admin123 |

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new player
- `POST /api/auth/login` - Login (returns JWT)
- `GET /api/auth/me` - Current user
- `PATCH /api/auth/me` - Update profile

### Lotteries
- `GET /api/lotteries` - List (filter by status)
- `GET /api/lotteries/{id}` - Detail
- `POST /api/lotteries` - Create (admin)
- `PATCH /api/lotteries/{id}` - Update (admin)
- `DELETE /api/lotteries/{id}` - Delete (admin)

### Tickets
- `GET /api/tickets` - List (own tickets or all for admin/POS)
- `GET /api/tickets/{id}` - Detail
- `POST /api/tickets` - Create entry (any authenticated user)
- `POST /api/tickets/validate` - Validate ticket code (POS/admin)
- `POST /api/tickets/{id}/mark-won` - Mark as winner (admin)
- `POST /api/tickets/casino-eligibility` - Check + auto-create for casino players

### Stats & Draw
- `GET /api/dashboard` - Admin dashboard stats
- `GET /api/lotteries/{id}/stats` - Lottery statistics
- `POST /api/draw` - Draw random winners (admin)

### Users (admin)
- `GET /api/users` - List (with search/role filter)
- `GET /api/users/{id}` - Detail
- `PATCH /api/users/{id}` - Update
- `POST /api/users/{id}/toggle-active` - Enable/disable
- `POST /api/users/{id}/reset-password` - Reset to default

### Marketing Widgets
- `GET /api/widgets/script/{lottery_id}.js` - Embeddable JS widget
- `GET /api/widgets/iframe/{lottery_id}` - Embeddable iframe
- `GET /api/widgets/data/{lottery_id}` - Widget data endpoint

## Entry Channels

1. **Casino Play** - External casino verifies eligibility via API, auto-creates ticket
2. **Direct Purchase** - Player buys entry through web frontend
3. **Physical Sale** - POS operator sells ticket, prints QR code

## Key Features

- Multiple concurrent lotteries
- Configurable entry limits per user
- Multi-channel ticket creation (online, casino, physical)
- QR code generation for physical tickets
- Real-time validation via code/QR scan
- Random draw with automatic winner/loser marking
- Admin dashboard with stats
- Embeddable marketing widgets (countdown, ticket count)
- JWT auth with role-based access (admin, POS operator, player)
