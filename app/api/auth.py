"""
Auth API – signup, verify-otp, login, resend-otp endpoints.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from app.services.auth_service import (
    create_user,
    verify_otp,
    authenticate_user,
    regenerate_otp,
)
from app.services.email_service import send_otp_email
from app.core.security import create_access_token
from app.core.logger import logger

router = APIRouter()


# ── Request / Response schemas ──────────────────────────

class SignupRequest(BaseModel):
    username: str
    email: EmailStr
    password: str


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ResendOtpRequest(BaseModel):
    email: EmailStr


# ── Endpoints ───────────────────────────────────────────

@router.post("/signup")
def signup(req: SignupRequest):
    """Register a new user, generate OTP, and send verification email."""
    # Validation
    if len(req.username.strip()) < 2:
        raise HTTPException(status_code=400, detail="Username must be at least 2 characters.")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    try:
        otp = create_user(req.username, req.email, req.password)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

    # Send OTP email (non-blocking failure — user can resend)
    email_sent = send_otp_email(req.email, otp)

    if email_sent:
        msg = "Account created. Please check your email for the verification code."
    else:
        msg = "Account created. OTP email could not be sent — check server logs or click Resend."
        logger.warning(f"OTP email failed for {req.email} — user can resend")

    return {
        "message": msg,
        "email_sent": email_sent,
    }


@router.post("/verify-otp")
def verify(req: VerifyOtpRequest):
    """Validate OTP and mark the account as verified."""
    try:
        verify_otp(req.email, req.otp)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"message": "Email verified successfully. You can now log in."}


@router.post("/login")
def login(req: LoginRequest):
    """Authenticate user — only if email is verified."""
    try:
        user = authenticate_user(req.email, req.password)
    except ValueError as e:
        detail = str(e)
        # Use 403 for "not verified" so the frontend can distinguish
        if "verify" in detail.lower():
            raise HTTPException(status_code=403, detail=detail)
        raise HTTPException(status_code=401, detail=detail)

    access_token = create_access_token(
        data={"sub": user["username"], "email": user["email"]}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user["username"],
        "email": user["email"]
    }


@router.post("/resend-otp")
def resend_otp(req: ResendOtpRequest):
    """Regenerate and resend the OTP for an unverified account."""
    try:
        otp = regenerate_otp(req.email)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    email_sent = send_otp_email(req.email, otp)

    if email_sent:
        msg = "A new verification code has been sent to your email."
    else:
        msg = "New OTP generated but email could not be sent — check server logs."

    return {
        "message": msg,
        "email_sent": email_sent,
    }
