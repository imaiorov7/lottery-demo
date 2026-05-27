from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth, coupons, game, lotteries, partners, reports, stats, tickets, users, widgets


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="Lottery Demo API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(lotteries.router)
app.include_router(tickets.router)
app.include_router(game.router)
app.include_router(stats.router)
app.include_router(reports.router)
app.include_router(users.router)
app.include_router(widgets.router)
app.include_router(coupons.router)
app.include_router(partners.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
