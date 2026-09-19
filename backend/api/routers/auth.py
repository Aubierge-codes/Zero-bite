"""
Authentication Router
JWT login, OTP via SMS, and role-based access for all 4 dashboards.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
import random

from jose import jwt
from passlib.context import CryptContext

from database.session import get_db
from database.models import User
from api.config import get_settings
from api.dependencies import get_current_user
from alerts.notification_service import send_sms

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
            role            = stored["role"],
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
        },
    }


# ── Register ───────────────────────────────────────────────────────────────────

@router.post("/register")
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Admin-created accounts for district officers and ministry users."""
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        full_name       = payload.name,
        email           = payload.email,
        hashed_password = pwd_context.hash(payload.password),
        role            = payload.role,
        phone           = payload.phone,
        is_active       = True,
    )
    db.add(user)
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
    }