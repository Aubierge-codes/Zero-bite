"""
Authentication Router
JWT login, OTP via SMS, and role-based access for all 4 dashboards.
"""

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from alerts.notification_service import send_sms
from alerts.sms_broadcast import normalize_rw_phone, sms_delivered
from api import rate_limit
from api.config import get_settings
from api.dependencies import get_current_user, require_admin
from data_pipeline.rwanda_districts import canonical_district
from database.models import ActivityLog, OtpCode, User
from database.session import get_db

router    = APIRouter()
settings  = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"
ROLES = {"admin", "health_official", "ministry", "district_officer", "community_worker", "field_worker"}


# ── Schemas ────────────────────────────────────────────────────────────────────

class OtpRequest(BaseModel):
    phone_number: str
    role:         str = "community_worker"   # accepted for backwards compatibility, ignored


class OtpVerify(BaseModel):
    phone_number: str
    otp_code:     str


class RegisterRequest(BaseModel):
    name:     str = Field(min_length=2, max_length=200)
    email:    EmailStr
    password: str = Field(min_length=8, max_length=128)
    role:     str = "field_worker"
    phone:    Optional[str] = None
    district: Optional[str] = None

    @field_validator("role")
    @classmethod
    def _known_role(cls, v: str) -> str:
        if v not in ROLES:
            raise ValueError(f"role must be one of: {', '.join(sorted(ROLES))}")
        return v


# ── Helpers ────────────────────────────────────────────────────────────────────

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire    = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def _hash_otp(phone: str, code: str) -> str:
    return hmac.new(settings.SECRET_KEY.encode(), f"{phone}:{code}".encode(), hashlib.sha256).hexdigest()


def _role_to_dashboard(role: str) -> str:
    """Maps user role to the web dashboard they land on after login."""
    return {
        "ministry":         "/national",
        "admin":            "/national",
        "health_official":  "/national",
        "district_officer": "/district",
        "community_worker": "/worker",
        "field_worker":     "/worker",
    }.get(role, "/public")


def _user_dict(user: User) -> dict:
    return {
        "id":       str(user.id),
        "name":     user.full_name,
        "email":    user.email,
        "role":     user.role,
        "phone":    user.phone,
        "district": user.district,
    }


def _token_response(user: User) -> dict:
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {
        "access_token": token,
        "token_type":   "bearer",
        "expires_in":   settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "role":         user.role,
        "redirect_to":  _role_to_dashboard(user.role),
        "user":         _user_dict(user),
    }


# ── Email + Password login ─────────────────────────────────────────────────────

@router.post("/login")
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """Email + password login. Returns a JWT, the role and the dashboard path."""
    email = form_data.username.strip().lower()
    rate_limit.limit(request, "login", limit=10, window_seconds=300, extra=email)

    user = (await db.execute(select(User).where(func.lower(User.email) == email))).scalar_one_or_none()
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")
    return _token_response(user)


# ── Phone OTP login ────────────────────────────────────────────────────────────

@router.post("/send-otp")
async def send_otp(payload: OtpRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Sends a 6-digit one-time code by SMS (Africa's Talking)."""
    phone = normalize_rw_phone(payload.phone_number)
    if not phone:
        raise HTTPException(status_code=422, detail="Enter a valid Rwandan mobile number (e.g. 078XXXXXXX).")
    rate_limit.limit(request, "send-otp", limit=3, window_seconds=600, extra=phone)

    code = f"{secrets.randbelow(1_000_000):06d}"
    await db.execute(delete(OtpCode).where(OtpCode.phone == phone))
    db.add(OtpCode(
        phone=phone,
        code_hash=_hash_otp(phone, code),
        expires_at=datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
    ))
    await db.commit()

    response = await send_sms(
        phone=phone,
        message=f"Your Zero Bite verification code is {code}. It expires in {settings.OTP_EXPIRE_MINUTES} minutes.",
    )
    delivered = sms_delivered(response)
    dev_mode = settings.DEBUG and not settings.is_production
    if not delivered and not dev_mode:
        raise HTTPException(status_code=503, detail="Could not send the verification SMS. Please try again later.")

    return {
        "message":      "Verification code sent" if delivered else "SMS gateway not configured (development mode)",
        "phone_number": phone,
        # Only exposed in local development when the SMS gateway is not configured.
        "dev_otp":      code if (dev_mode and not delivered) else None,
    }


@router.post("/verify-otp")
async def verify_otp(payload: OtpVerify, request: Request, db: AsyncSession = Depends(get_db)):
    """Verifies the code and returns a JWT. New phone numbers get a community-worker account."""
    phone = normalize_rw_phone(payload.phone_number)
    if not phone:
        raise HTTPException(status_code=422, detail="Enter a valid Rwandan mobile number.")
    rate_limit.limit(request, "verify-otp", limit=10, window_seconds=600, extra=phone)

    record = (await db.execute(select(OtpCode).where(OtpCode.phone == phone))).scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=400, detail="No code requested for this number")
    if datetime.utcnow() > record.expires_at:
        await db.delete(record)
        await db.commit()
        raise HTTPException(status_code=400, detail="Code expired — request a new one")
    if record.attempts >= settings.OTP_MAX_ATTEMPTS:
        await db.delete(record)
        await db.commit()
        raise HTTPException(status_code=429, detail="Too many wrong attempts — request a new code")
    if not hmac.compare_digest(record.code_hash, _hash_otp(phone, payload.otp_code.strip())):
        record.attempts += 1
        await db.commit()
        raise HTTPException(status_code=401, detail="Invalid code")

    await db.delete(record)

    user = (await db.execute(select(User).where(User.phone == phone))).scalar_one_or_none()
    if not user:
        user = User(
            full_name       = f"User {phone[-4:]}",
            email           = f"{phone.lstrip('+')}@phone.zerobite.local",
            # Random, never-disclosed password: phone accounts can only sign in by OTP.
            hashed_password = pwd_context.hash(secrets.token_urlsafe(32)),
            role            = "community_worker",   # never trust a client-supplied role
            phone           = phone,
            is_active       = True,
        )
        db.add(user)
        db.add(ActivityLog(event_type="user_registered", description=f"Phone account created for {phone}"))
    elif not user.is_active:
        await db.commit()
        raise HTTPException(status_code=403, detail="Account deactivated")

    await db.commit()
    await db.refresh(user)
    return _token_response(user)


# ── Register (admin) ───────────────────────────────────────────────────────────

_optional_bearer = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


@router.post("/register")
async def register(
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db),
    token: Optional[str] = Depends(_optional_bearer),
):
    """
    Admin-created accounts for staff. Only an admin/health official may create
    accounts; the very first account (empty user table) can be created without
    a token to bootstrap the system.
    """
    existing_users = (await db.execute(select(func.count()).select_from(User))).scalar_one()
    if existing_users > 0:
        if not token:
            raise HTTPException(status_code=401, detail="Sign in as an administrator to create accounts")
        caller = await get_current_user(token=token, db=db)
        if caller.role not in ("admin", "health_official"):
            raise HTTPException(status_code=403, detail="Admin or health official role required")

    email = payload.email.strip().lower()
    if (await db.execute(select(User).where(func.lower(User.email) == email))).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    phone = None
    if payload.phone:
        phone = normalize_rw_phone(payload.phone)
        if not phone:
            raise HTTPException(status_code=422, detail="Enter a valid Rwandan mobile number.")
        if (await db.execute(select(User).where(User.phone == phone))).scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Phone number already registered")

    district = None
    if payload.district:
        district = canonical_district(payload.district)
        if not district:
            raise HTTPException(status_code=422, detail=f"Unknown district '{payload.district}'")

    user = User(
        full_name       = payload.name.strip(),
        email           = email,
        hashed_password = pwd_context.hash(payload.password),
        role            = payload.role,
        phone           = phone,
        district        = district,
        is_active       = True,
    )
    db.add(user)
    db.add(ActivityLog(event_type="user_registered",
                       description=f"Account created for {payload.name} ({payload.role})"))
    await db.commit()
    return {
        "message":      "User registered successfully",
        "email":        email,
        "role":         payload.role,
        "redirect_to":  _role_to_dashboard(payload.role),
    }


# ── Logout / token check ───────────────────────────────────────────────────────

@router.post("/logout")
async def logout():
    """Client-side logout — the client discards its token."""
    return {"message": "Logged out successfully"}


@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Current user from the token — used by the dashboards and the mobile app on load."""
    return _user_dict(current_user)


class ProfileUpdate(BaseModel):
    name:     Optional[str] = Field(default=None, min_length=2, max_length=200)
    district: Optional[str] = None


@router.patch("/me")
async def update_profile(payload: ProfileUpdate, db: AsyncSession = Depends(get_db),
                         current_user: User = Depends(get_current_user)):
    """Lets any signed-in user set their display name and home district."""
    if payload.name is not None:
        current_user.full_name = payload.name.strip()
    if payload.district is not None:
        district = canonical_district(payload.district)
        if not district:
            raise HTTPException(status_code=422, detail=f"Unknown district '{payload.district}'")
        current_user.district = district
    await db.commit()
    await db.refresh(current_user)
    return _user_dict(current_user)


# ── Admin: user management ─────────────────────────────────────────────────────

@router.get("/users")
async def list_users(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    users = (await db.execute(select(User).order_by(User.created_at.desc()))).scalars().all()
    return [{**_user_dict(u), "is_active": u.is_active, "created_at": u.created_at} for u in users]


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
