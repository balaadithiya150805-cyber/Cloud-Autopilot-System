"""
Auth API – signup, verify-otp, login, resend-otp endpoints.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr

from app.services.auth_service import (
    create_user,
    verify_otp,
    authenticate_user,
    regenerate_otp,
    store_refresh_token,
    revoke_refresh_token,
    is_refresh_token_valid,
    update_user_email,
    change_user_password,
    get_user_profile,
)
from app.services.email_service import send_otp_email
from app.core.security import create_access_token, create_refresh_token, verify_token, get_current_user
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

class RefreshRequest(BaseModel):
    refresh_token: str

class LogoutRequest(BaseModel):
    refresh_token: str

class UpdateEmailRequest(BaseModel):
    current_password: str
    new_email: EmailStr

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


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
    refresh_token = create_refresh_token(
        data={"sub": user["username"], "email": user["email"]}
    )
    
    store_refresh_token(user["email"], refresh_token)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "username": user["username"],
        "email": user["email"]
    }

@router.post("/refresh")
def refresh(req: RefreshRequest):
    """Exchange a valid refresh token for a new access token."""
    try:
        payload = verify_token(req.refresh_token, expected_type="refresh")
        email = payload.get("email")
        if not is_refresh_token_valid(req.refresh_token, email):
            raise HTTPException(status_code=401, detail="Refresh token revoked or invalid.")
            
        access_token = create_access_token(
            data={"sub": payload.get("sub"), "email": email}
        )
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token.")

@router.post("/logout")
def logout(req: LogoutRequest):
    """Revoke the current refresh token."""
    revoke_refresh_token(req.refresh_token)
    return {"message": "Logged out successfully."}


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


@router.get("/profile")
def profile(current_user: dict = Depends(get_current_user)):
    """Get the current user's profile info."""
    try:
        return get_user_profile(current_user["email"])
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/update-email")
def update_email(req: UpdateEmailRequest, current_user: dict = Depends(get_current_user)):
    """Update the user's email address (requires password confirmation)."""
    try:
        result = update_user_email(current_user["email"], req.new_email, req.current_password)
        # Generate new tokens with updated email
        access_token = create_access_token(
            data={"sub": result["username"], "email": result["email"]}
        )
        refresh_token = create_refresh_token(
            data={"sub": result["username"], "email": result["email"]}
        )
        store_refresh_token(result["email"], refresh_token)
        return {
            "message": "Email updated successfully.",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "username": result["username"],
            "email": result["email"],
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/change-password")
def change_password(req: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    """Change the user's password (requires current password)."""
    try:
        change_user_password(current_user["email"], req.current_password, req.new_password)
        return {"message": "Password changed successfully."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
