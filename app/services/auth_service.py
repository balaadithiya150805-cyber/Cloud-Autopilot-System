"""
Auth service – user CRUD, OTP generation, password hashing.
Uses the same MongoDB client as db_service.
"""

import random
import string
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict

from fastapi import HTTPException
from passlib.hash import bcrypt

from app.services.db_service import db
from app.core.config import settings
from app.core.logger import logger

# ── Resend cooldown (seconds) ───────────────────────────
RESEND_COOLDOWN_SECONDS = 60

# ── MongoDB collection ──────────────────────────────────
users_col = db["users"]
sessions_col = db["sessions"]

# Lazy index creation (avoids crashing import when Mongo is offline)
_index_ensured = False

def _ensure_index():
    global _index_ensured
    if not _index_ensured:
        try:
            users_col.create_index("email", unique=True)
            _index_ensured = True
        except Exception as e:
            logger.warning(f"Could not create users index: {e}")


# ── Helpers ─────────────────────────────────────────────

def _generate_otp(length: int = 6) -> str:
    """Generate a random numeric OTP."""
    return "".join(random.choices(string.digits, k=length))


def validate_password(password: str) -> None:
    """
    Validate password length is within 8–16 characters.
    Raises HTTPException(400) with a clear message if invalid.
    Must be called BEFORE bcrypt hashing to prevent the
    72-byte bcrypt limit from silently truncating input.
    """
    if not password or not isinstance(password, str):
        raise HTTPException(status_code=400, detail="Password must be between 8 and 16 characters.")
    if len(password) < 8 or len(password) > 16:
        raise HTTPException(status_code=400, detail="Password must be between 8 and 16 characters.")


def hash_password(password: str) -> str:
    validate_password(password)
    try:
        return bcrypt.hash(password)
    except ValueError as e:
        logger.error(f"bcrypt ValueError (possibly truncate error): {e}")
        raise HTTPException(status_code=400, detail="Password must be between 8 and 16 characters.")
    except Exception as e:
        logger.error(f"bcrypt hash error: {e}")
        raise HTTPException(status_code=400, detail="Password must be between 8 and 16 characters.")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not isinstance(plain_password, str):
        raise HTTPException(status_code=400, detail="Password must be between 8 and 16 characters.")
    if len(plain_password) > 16:
        raise HTTPException(status_code=400, detail="Password must be between 8 and 16 characters.")
    try:
        return bcrypt.verify(plain_password, hashed_password)
    except ValueError as e:
        logger.error(f"bcrypt ValueError (possibly truncate error): {e}")
        raise HTTPException(status_code=400, detail="Password must be between 8 and 16 characters.")
    except Exception as e:
        logger.error(f"bcrypt verify error: {e}")
        raise HTTPException(status_code=400, detail="Password must be between 8 and 16 characters.")


# ── Public API ──────────────────────────────────────────

def get_user_by_email(email: str) -> Optional[Dict]:
    """Lookup a user document by email (case-insensitive)."""
    _ensure_index()
    try:
        return users_col.find_one({"email": email.lower()})
    except Exception as e:
        logger.warning(f"Database error in get_user_by_email: {e}")
        return None


def create_user(username: str, email: str, password: str) -> str:
    """
    Register a new user.

    - Hash the password with bcrypt.
    - Generate a 6-digit OTP valid for 10 minutes.
    - Insert into the users collection.

    Returns the plaintext OTP so the caller can email it.
    Raises ValueError if the email is already registered.
    """
    email = email.lower().strip()

    # Validate password before any DB or bcrypt operations
    validate_password(password)

    if get_user_by_email(email):
        raise ValueError("An account with this email already exists.")

    otp = _generate_otp()
    otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)

    doc = {
        "username": username.strip(),
        "email": email,
        "password_hash": hash_password(password),
        "is_verified": False,
        "otp": otp,
        "otp_expiry": otp_expiry,
        "created_at": datetime.now(timezone.utc),
    }

    users_col.insert_one(doc)
    logger.info(f"User created: {email} (pending verification)")

    if settings.is_dev:
        logger.info(f"[DEV] OTP for {email}: {otp}")

    return otp


def regenerate_otp(email: str) -> str:
    """
    Generate a fresh OTP for an existing, unverified user.
    Enforces a 60-second cooldown between resends.
    Returns the new plaintext OTP.
    Raises ValueError if user not found, already verified, or cooldown active.
    """
    email = email.lower().strip()
    user = get_user_by_email(email)

    if not user:
        raise ValueError("No account found with this email.")
    if user.get("is_verified"):
        raise ValueError("This account is already verified.")

    # ── Cooldown check ──
    last_otp_time = user.get("otp_expiry")
    if last_otp_time:
        # otp_expiry is set to now+10min, so last_sent = otp_expiry - 10min
        last_sent = last_otp_time - timedelta(minutes=10)
        elapsed = (datetime.now(timezone.utc) - last_sent).total_seconds()
        if elapsed < RESEND_COOLDOWN_SECONDS:
            wait = int(RESEND_COOLDOWN_SECONDS - elapsed)
            raise ValueError(f"Please wait {wait} seconds before requesting a new code.")

    otp = _generate_otp()
    otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)

    users_col.update_one(
        {"email": email},
        {"$set": {"otp": otp, "otp_expiry": otp_expiry}},
    )
    logger.info(f"OTP regenerated for: {email}")

    if settings.is_dev:
        logger.info(f"[DEV] New OTP for {email}: {otp}")

    return otp


def verify_otp(email: str, otp: str) -> bool:
    """
    Validate an OTP and mark the user as verified.

    Raises ValueError with a descriptive message on failure.
    Returns True on success.
    """
    email = email.lower().strip()
    user = get_user_by_email(email)

    if not user:
        raise ValueError("No account found with this email.")

    if user.get("is_verified"):
        raise ValueError("This account is already verified.")

    stored_otp = user.get("otp")
    otp_expiry = user.get("otp_expiry")

    if not stored_otp or stored_otp != otp:
        raise ValueError("Invalid OTP. Please check and try again.")

    if otp_expiry and datetime.now(timezone.utc) > otp_expiry:
        raise ValueError("OTP has expired. Please request a new one.")

    # Mark verified and clear OTP fields
    users_col.update_one(
        {"email": email},
        {
            "$set": {"is_verified": True},
            "$unset": {"otp": "", "otp_expiry": ""},
        },
    )
    logger.info(f"User verified: {email}")
    return True


def authenticate_user(email: str, password: str) -> Dict:
    """
    Authenticate a user by email + password.

    Raises ValueError if credentials are wrong or account is not verified.
    Returns a safe user dict (no password hash).
    """
    email = email.lower().strip()
    user = get_user_by_email(email)

    if not user:
        # ── Demo Mode Fallback ──
        if email == "admin@example.com" and password == "password123":
            return {"username": "Admin", "email": "admin@example.com"}
        raise ValueError("Invalid email or password.")

    if not password or not isinstance(password, str) or len(password) > 16:
        raise HTTPException(status_code=400, detail="Password must be between 8 and 16 characters.")

    if not verify_password(password, user["password_hash"]):
        raise ValueError("Invalid email or password.")

    if not user.get("is_verified"):
        raise ValueError("Please verify your email before logging in.")

    return {
        "username": user["username"],
        "email": user["email"],
    }

def store_refresh_token(email: str, refresh_token: str):
    """Store the refresh token in the database as a session."""
    if email.lower() == "admin@example.com":
        return # Skip DB store for demo account
        
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    try:
        sessions_col.insert_one({
            "email": email.lower(),
            "refresh_token": refresh_token,
            "expires_at": expires_at
        })
    except Exception as e:
        logger.warning(f"Could not store refresh token: {e}")

def revoke_refresh_token(refresh_token: str):
    """Delete the refresh token from the database."""
    try:
        sessions_col.delete_one({"refresh_token": refresh_token})
    except Exception as e:
        logger.warning(f"Could not revoke refresh token: {e}")

def is_refresh_token_valid(refresh_token: str, email: str) -> bool:
    """Check if the refresh token exists and matches the email."""
    if email.lower() == "admin@example.com":
        return True
    try:
        session = sessions_col.find_one({
            "refresh_token": refresh_token, 
            "email": email.lower()
        })
        return session is not None
    except Exception as e:
        logger.warning(f"Database error in is_refresh_token_valid: {e}")
        return False


def update_user_email(current_email: str, new_email: str, password: str) -> Dict:
    """
    Update user's email after verifying their password.
    Raises ValueError on failure.
    Returns updated safe user dict.
    """
    current_email = current_email.lower().strip()
    new_email = new_email.lower().strip()

    if current_email == new_email:
        raise ValueError("New email is the same as the current email.")

    user = get_user_by_email(current_email)
    if not user:
        raise ValueError("User not found.")

    if not verify_password(password, user["password_hash"]):
        raise ValueError("Incorrect password.")

    # Check if new email is already taken
    if get_user_by_email(new_email):
        raise ValueError("An account with this email already exists.")

    users_col.update_one(
        {"email": current_email},
        {"$set": {"email": new_email}}
    )
    logger.info(f"Email updated: {current_email} -> {new_email}")
    return {"username": user["username"], "email": new_email}


def change_user_password(email: str, current_password: str, new_password: str) -> bool:
    """
    Change user's password after verifying the current one.
    Raises ValueError on failure.
    """
    validate_password(new_password)
    email = email.lower().strip()
    user = get_user_by_email(email)

    if not user:
        raise ValueError("User not found.")

    if not verify_password(current_password, user["password_hash"]):
        raise ValueError("Current password is incorrect.")

    validate_password(new_password)

    users_col.update_one(
        {"email": email},
        {"$set": {"password_hash": hash_password(new_password)}}
    )
    logger.info(f"Password changed for: {email}")
    return True


def get_user_profile(email: str) -> Dict:
    """
    Return a safe user profile dict (no password hash or OTP).
    Raises ValueError if user not found.
    """
    email = email.lower().strip()
    
    # ── Demo Mode Fallback ──
    if email == "admin@example.com":
        return {
            "username": "Admin",
            "email": "admin@example.com",
            "is_verified": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "has_aws_credentials": False,
        }
        
    user = get_user_by_email(email)

    if not user:
        raise ValueError("User not found.")

    return {
        "username": user.get("username", ""),
        "email": user.get("email", ""),
        "is_verified": user.get("is_verified", False),
        "created_at": user.get("created_at", ""),
        "has_aws_credentials": bool(user.get("aws_access_key_id")),
    }
