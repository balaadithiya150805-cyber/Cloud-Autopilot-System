"""
Auth service – user CRUD, OTP generation, password hashing.
Uses the same MongoDB client as db_service.
"""

import random
import string
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict

from passlib.hash import bcrypt

from app.services.db_service import db
from app.core.config import settings
from app.core.logger import logger

# ── Resend cooldown (seconds) ───────────────────────────
RESEND_COOLDOWN_SECONDS = 60

# ── MongoDB collection ──────────────────────────────────
users_col = db["users"]

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


# ── Public API ──────────────────────────────────────────

def get_user_by_email(email: str) -> Optional[Dict]:
    """Lookup a user document by email (case-insensitive)."""
    _ensure_index()
    return users_col.find_one({"email": email.lower()})


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

    if get_user_by_email(email):
        raise ValueError("An account with this email already exists.")

    otp = _generate_otp()
    otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)

    doc = {
        "username": username.strip(),
        "email": email,
        "password_hash": bcrypt.hash(password),
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
        raise ValueError("Invalid email or password.")

    if not bcrypt.verify(password, user["password_hash"]):
        raise ValueError("Invalid email or password.")

    if not user.get("is_verified"):
        raise ValueError("Please verify your email before logging in.")

    return {
        "username": user["username"],
        "email": user["email"],
    }
