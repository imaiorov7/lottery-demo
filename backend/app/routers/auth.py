from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.database import get_db
from app.models import PartnerConfig, User, UserRole
from app.schemas import (
    LoginRequest,
    RegisterRequest,
    Token,
    UserOut,
    UserUpdate,
)


class WidgetSSORequest(BaseModel):
    api_key: str
    external_player_id: str
    player_name: str | None = None
    player_email: str | None = None

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        full_name=body.full_name,
        phone=body.phone,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=Token)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")

    token = create_access_token(user.id, user.role)
    return Token(access_token=token)


@router.post("/widget-sso", response_model=Token)
async def widget_sso(body: WidgetSSORequest, db: AsyncSession = Depends(get_db)):
    """
    Called server-side by the casino operator to get a short-lived player token
    for embedding the widget iframe. The casino passes their API key and the
    player's external ID; we return a JWT the iframe can use directly.
    """
    partner_result = await db.execute(
        select(PartnerConfig).where(PartnerConfig.api_key == body.api_key, PartnerConfig.is_active == True)
    )
    partner = partner_result.scalar_one_or_none()
    if not partner:
        raise HTTPException(status_code=401, detail="Invalid API key")

    ext_id = f"{partner.casino_external_id_prefix or ''}{body.external_player_id}"

    # Find or auto-create player
    result = await db.execute(select(User).where(User.external_player_id == ext_id))
    user = result.scalar_one_or_none()
    if not user:
        email = body.player_email or f"{ext_id.lower().replace(' ', '_')}@widget.casino"
        user = User(
            email=email,
            password_hash=hash_password("widget_sso_no_password"),
            full_name=body.player_name or ext_id,
            external_player_id=ext_id,
            role=UserRole.PLAYER,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token = create_access_token(user.id, user.role)
    return Token(access_token=token)


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
async def update_me(
    body: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.full_name is not None:
        current_user.full_name = body.full_name
    if body.phone is not None:
        current_user.phone = body.phone
    if body.external_player_id is not None:
        current_user.external_player_id = body.external_player_id
    await db.commit()
    await db.refresh(current_user)
    return current_user
