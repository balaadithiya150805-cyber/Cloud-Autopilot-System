"""
Auth API – signup, verify-otp, login, resend-otp endpoints.
"""

from fastapi import APIRouter, HTTPException, Depends
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from pydantic import BaseModel, EmailStr, Field

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
    password: str = Field(..., min_length=8, max_length=16)


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., max_length=16)


class ResendOtpRequest(BaseModel):
    email: EmailStr

class RefreshRequest(BaseModel):
    refresh_token: str

class LogoutRequest(BaseModel):
    refresh_token: str

class UpdateEmailRequest(BaseModel):
    current_password: str = Field(..., max_length=16)
    new_email: EmailStr

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., max_length=16)
    new_password: str = Field(..., min_length=8, max_length=16)


# ── Endpoints ───────────────────────────────────────────

@router.post("/signup")
def signup(req: SignupRequest):
    """Register a new user, generate OTP, and send verification email."""
    # Validation
    if len(req.username.strip()) < 2:
        raise HTTPException(status_code=400, detail="Username must be at least 2 characters.")
    if len(req.password) < 8 or len(req.password) > 16:
        raise HTTPException(status_code=400, detail="Password must be between 8 and 16 characters.")

    try:
        otp, is_new = create_user(req.username, req.email, req.password)
    except ValueError as e:
        detail = str(e)
        if detail == "Password must be between 8 and 16 characters.":
            raise HTTPException(status_code=400, detail=detail)
        # Distinguish verified-email from validation errors (400)
        raise HTTPException(status_code=400, detail=detail)
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        logger.error(f"MongoDB error during signup: {e}")
        raise HTTPException(status_code=503, detail="Database temporarily unavailable. Please try again later.")
    except Exception as e:
        logger.error(f"Unexpected error during signup: {e}")
        raise HTTPException(status_code=503, detail="Database temporarily unavailable. Please try again later.")

    # Send OTP email (non-blocking failure — user can resend)
    email_sent = send_otp_email(req.email, otp)

    if email_sent:
        if is_new:
            msg = "Account created. Please check your email for the verification code."
        else:
            msg = "Account exists but is not verified. A new OTP has been sent."
    else:
        msg = "Account created. OTP email could not be sent — check server logs or click Resend."
        logger.warning(f"OTP email failed for {req.email} — user can resend")

    return {
        "message": msg,
        "email_sent": email_sent,
        "is_new": is_new,
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
        if detail == "Password must be between 8 and 16 characters.":
            raise HTTPException(status_code=400, detail=detail)
        # Use 403 for "not verified" so the frontend can distinguish
        if "verify" in detail.lower():
            raise HTTPException(status_code=403, detail=detail)
        raise HTTPException(status_code=401, detail=detail)
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        logger.error(f"MongoDB error during login: {e}")
        raise HTTPException(status_code=503, detail="Database temporarily unavailable. Please try again later.")

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
        detail = str(e)
        if "not found" in detail.lower():
            raise HTTPException(status_code=404, detail=detail)
        raise HTTPException(status_code=400, detail=detail)

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
        detail = str(e)
        if detail == "Password must be between 8 and 16 characters.":
            raise HTTPException(status_code=400, detail=detail)
        raise HTTPException(status_code=400, detail=detail)


@router.put("/change-password")
def change_password(req: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    """Change the user's password (requires current password)."""
    try:
        change_user_password(current_user["email"], req.current_password, req.new_password)
        return {"message": "Password changed successfully."}
    except ValueError as e:
        detail = str(e)
        if detail == "Password must be between 8 and 16 characters.":
            raise HTTPException(status_code=400, detail=detail)
        raise HTTPException(status_code=400, detail=detail)
