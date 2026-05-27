# Lottery Demo System

## Quick Start

```bash
docker compose up --build
```

## Access URLs

After starting Docker, open these URLs in your browser:

- **Frontend (Player)**: http://localhost:5173
- **Backoffice (Admin)**: http://localhost:5174
- **POS (Operator)**: http://localhost:5175
- **Backend API**: http://localhost:8000

Full MVP demo system for a lottery/raffle platform with multiple entry channels.

## Architecture

```
lottery_demo/
  backend/       FastAPI + SQLAlchemy + PostgreSQL
  frontend/      Player-facing React app (entry purchase, ticket view)
  backoffice/    Admin panel (lottery management, stats, draw)
  pos/           POS terminal (sell tickets, validate via QR/code)
```

## Quick Start

### With Docker (recommended)

```bash
docker-compose up --build
```

Services:
- **Backend API**: http://localhost:8000 (docs at /docs)
- **Player Frontend**: http://localhost:5173
- **Admin Backoffice**: http://localhost:5174
- **POS Terminal**: http://localhost:5175

### Seed Demo Data

```bash
docker-compose exec backend python -m app.seed
```

### Without Docker (local dev)

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# In another terminal - seed data
cd backend
python -m app.seed

# Frontend (any of the three)
cd frontend  # or backoffice / pos
npm install
npm run dev
```

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@lottery.demo | admin123 |
| POS Operator | pos@lottery.demo | pos123 |
| Player | player@lottery.demo | player123 |

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
