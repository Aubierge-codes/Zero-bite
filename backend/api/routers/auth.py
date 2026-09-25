"""
Authentication Router
JWT login, OTP via SMS, and role-based access for all 4 dashboards.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
import random

from jose import jwt
from passlib.context import CryptContext

from database.session import get_db
from database.models import User, ActivityLog
from api.dependencies import require_admin
from api.config import get_settings
from api.dependencies import get_current_user
from alerts.notification_service import send_sms
from data_pipeline.rwanda_districts import canonical_district

router    = APIRouter()
settings  = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY               = settings.SECRET_KEY
ALGORITHM                = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8

# In-memory OTP store — replace with Redis in production
_otp_store: dict = {}


# ── Schemas ────────────────────────────────────────────────────────────────────

class OtpRequest(BaseModel):
    phone_number: str
    role:         str = "community_worker"

class OtpVerify(BaseModel):
    phone_number: str
    otp_code:     str

class RegisterRequest(BaseModel):
    name:     str
    email:    str
    password: str
    role:     str = "field_worker"
    phone:    Optional[str] = None
    district: Optional[str] = None


# ── Token helper ───────────────────────────────────────────────────────────────

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire    = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def _role_to_dashboard(role: str) -> str:
    """Maps user role to which dashboard they land on after login."""
    return {
        "ministry":         "/ministry/dashboard",
        "district_officer": "/district/dashboard",
        "community_worker": "/worker/dashboard",
        "public":           "/public",
        "field_worker":     "/worker/dashboard",
        "admin":            "/admin/settings",
    }.get(role, "/public")


# ── Email + Password login ─────────────────────────────────────────────────────

@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """
    Screen 1 — 'Email & Pass' tab login.
    Returns JWT + role + redirect path so frontend knows which dashboard to show.
    """
    result = await db.execute(select(User).where(User.email == form_data.username))
    user   = result.scalar_one_or_none()

    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")

    token = create_access_token({
        "sub":   str(user.id),
        "email": user.email,
        "role":  user.role,
    })

    return {
        "access_token": token,
        "token_type":   "bearer",
        "role":         user.role,
        "redirect_to":  _role_to_dashboard(user.role),
        "user": {
            "id":       str(user.id),
            "name":     user.full_name,
            "email":    user.email,
            "role":     user.role,
            "phone":    user.phone,
            "district": user.district,
        },
    }


# ── Phone OTP login ────────────────────────────────────────────────────────────

@router.post("/send-otp")
async def send_otp(payload: OtpRequest, db: AsyncSession = Depends(get_db)):
    """
    Screen 1 — 'Phone OTP' tab. Sends 6-digit OTP via Africa's Talking SMS.
    """
    otp  = str(random.randint(100000, 999999))
    _otp_store[payload.phone_number] = {
        "otp":     otp,
        "role":    payload.role,
        "expires": datetime.utcnow() + timedelta(minutes=10),
    }

    message = f"Your Zero Bite verification code is: {otp}. Valid for 10 minutes."

    try:
        await send_sms(phone=payload.phone_number, message=message)
    except Exception as e:
        # Still return success in dev — OTP is in logs
        pass

    return {
        "message":      "OTP sent to your phone number",
        "phone_number": payload.phone_number,
        # Remove next line in production — only for development testing
        "dev_otp":      otp if settings.DEBUG else None,
    }


@router.post("/verify-otp")
async def verify_otp(payload: OtpVerify, db: AsyncSession = Depends(get_db)):
    """
    Screen 1 — Verifies OTP and returns JWT token.
    Creates a new user record if the phone number is new.
    """
    stored = _otp_store.get(payload.phone_number)

    if not stored:
        raise HTTPException(status_code=400, detail="No OTP requested for this number")
    if datetime.utcnow() > stored["expires"]:
        del _otp_store[payload.phone_number]
        raise HTTPException(status_code=400, detail="OTP expired — request a new one")
    if stored["otp"] != payload.otp_code:
        raise HTTPException(status_code=401, detail="Invalid OTP code")

    # OTP valid — clean up store
    del _otp_store[payload.phone_number]

    # Find or create user by phone
    result = await db.execute(select(User).where(User.phone == payload.phone_number))
    user   = result.scalar_one_or_none()

    if not user:
        user = User(
            full_name       = f"User {payload.phone_number[-4:]}",
            email           = f"{payload.phone_number}@zerobite.local",
            hashed_password = pwd_context.hash("otp-login"),
            role            = "community_worker",   # never trust a client-supplied role for self-created accounts
            phone           = payload.phone_number,
            is_active       = True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token = create_access_token({
        "sub":   str(user.id),
        "phone": user.phone,
        "role":  user.role,
    })

    return {
        "access_token": token,
        "token_type":   "bearer",
        "role":         user.role,
        "redirect_to":  _role_to_dashboard(user.role),
        "user": {
            "id":    str(user.id),
            "name":  user.full_name,
            "phone": user.phone,
            "role":  user.role,
            "district": user.district,
        },
    }


# ── Register ───────────────────────────────────────────────────────────────────

_optional_bearer = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


@router.post("/register")
async def register(
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db),
    token: Optional[str] = Depends(_optional_bearer),
):
    """
    Admin-created accounts for district officers and ministry users.
    Only an admin/health official may create accounts; the very first account
    (empty user table) can be created without a token to bootstrap the system.
    """
    existing_users = (await db.execute(select(func.count()).select_from(User))).scalar_one()
    if existing_users > 0:
        if not token:
            raise HTTPException(status_code=401, detail="Sign in as an administrator to create accounts")
        caller = await get_current_user(token=token, db=db)
        if caller.role not in ("admin", "health_official"):
            raise HTTPException(status_code=403, detail="Admin or health official role required")

    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        full_name       = payload.name,
        email           = payload.email,
        hashed_password = pwd_context.hash(payload.password),
        role            = payload.role,
        phone           = payload.phone,
        district        = canonical_district(payload.district) if payload.district else None,
        is_active       = True,
    )
    db.add(user)
    db.add(ActivityLog(event_type="user_registered",
                       description=f"Account created for {payload.name} ({payload.role})"))
    await db.commit()
    return {
        "message":      "User registered successfully",
        "email":        payload.email,
        "role":         payload.role,
        "redirect_to":  _role_to_dashboard(payload.role),
    }


# ── Logout / token check ───────────────────────────────────────────────────────

@router.post("/logout")
async def logout():
    """Client-side logout — just confirms token should be discarded."""
    return {"message": "Logged out successfully"}


@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Returns current user info from token — used by all dashboards on load."""
    return {
        "id":    str(current_user.id),
        "name":  current_user.full_name,
        "email": current_user.email,
        "role":  current_user.role,
        "phone": current_user.phone,
        "district": current_user.district,
    }


# ── Admin: user management ─────────────────────────────────────────────────────

@router.get("/users")
async def list_users(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    users = (await db.execute(select(User).order_by(User.created_at.desc()))).scalars().all()
    return [{"id": str(u.id), "name": u.full_name, "email": u.email, "role": u.role,
             "district": u.district, "phone": u.phone, "is_active": u.is_active,
             "created_at": u.created_at} for u in users]


class ActiveToggle(BaseModel):
    is_active: bool


@router.patch("/users/{user_id}/active")
async def set_user_active(user_id: str, payload: ActiveToggle,
                          db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if str(user.id) == str(admin.id) and not payload.is_active:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account")
    user.is_active = payload.is_active
    db.add(ActivityLog(event_type="user_status",
                       description=f"{admin.email} {'activated' if payload.is_active else 'deactivated'} {user.email}"))
    await db.commit()
    return {"id": str(user.id), "is_active": user.is_active}
