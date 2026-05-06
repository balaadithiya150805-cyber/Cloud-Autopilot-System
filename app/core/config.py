from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache
import logging
import os

_config_logger = logging.getLogger("cloud_autopilot.config")

class Settings(BaseSettings):
    PROJECT_NAME: str = "Cloud Autopilot System"
    ENVIRONMENT: str = "development"
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_DEFAULT_REGION: str = "us-east-1"
    MONGO_URI: str = "mongodb://localhost:27017/"
    MONGO_DB_NAME: str = "cloudcost"
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    JWT_SECRET: str = "super-secret-key-for-dev"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440  # 24 hours
    JWT_REFRESH_EXPIRATION_DAYS: int = 7
    FRONTEND_URL: str = "*"
    RATE_LIMIT_PER_MINUTE: int = 10

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def is_dev(self) -> bool:
        return self.ENVIRONMENT.lower() in ("development", "dev")

    @property
    def smtp_configured(self) -> bool:
        """True when SMTP creds look real (not empty / placeholder)."""
        placeholders = {"", "your_email@gmail.com", "your_app_password"}
        return (
            self.SMTP_USER not in placeholders
            and self.SMTP_PASSWORD not in placeholders
        )

@lru_cache()
def get_settings():
    s = Settings()
    # ── Validate SMTP config at startup ──
    if not s.SMTP_HOST:
        _config_logger.error("SMTP_HOST is missing in .env — email sending will fail!")
    if not s.smtp_configured:
        _config_logger.warning(
            "SMTP credentials are missing or still set to placeholders. "
            "OTP emails will NOT be sent. Set SMTP_USER and SMTP_PASSWORD in .env. "
            "In dev mode, OTPs will be printed to console."
        )
    return s


def validate_environment():
    """Log warnings for missing/placeholder environment variables at startup."""
    issues: list[str] = []

    if settings.JWT_SECRET == "super-secret-key-for-dev":
        issues.append("JWT_SECRET is still the default dev key — change it in .env for production.")

    if not os.environ.get("ENCRYPTION_KEY"):
        issues.append("ENCRYPTION_KEY not set — AWS credential encryption uses a temporary key.")

    if not settings.MONGO_URI or settings.MONGO_URI == "mongodb://localhost:27017/":
        issues.append("MONGO_URI is localhost — set a remote URI for production.")

    if not settings.smtp_configured:
        issues.append("SMTP credentials missing — email notifications disabled.")

    if settings.FRONTEND_URL == "*":
        issues.append("FRONTEND_URL is wildcard — restrict CORS origins in production.")

    for issue in issues:
        _config_logger.warning(f"[ENV] {issue}")

    if not issues:
        _config_logger.info("Environment validation passed — all config looks good.")


settings = get_settings()
