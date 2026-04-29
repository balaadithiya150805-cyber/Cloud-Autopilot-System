from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache
import logging

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
    JWT_EXPIRATION_MINUTES: int = 1440 # 24 hours
    FRONTEND_URL: str = "*"

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

settings = get_settings()
