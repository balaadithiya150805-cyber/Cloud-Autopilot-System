import os
from cryptography.fernet import Fernet
from app.core.logger import logger
from app.core.config import settings

# In production, this should be set via environment variable.
# For demonstration/dev, we generate one if missing.
# NEVER hardcode this in production.
ENCRYPTION_KEY = os.environ.get("ENCRYPTION_KEY")

if not ENCRYPTION_KEY:
    if settings.is_dev:
        # Generate a temporary key for dev
        ENCRYPTION_KEY = Fernet.generate_key().decode()
        logger.warning("No ENCRYPTION_KEY found in env. Generated temporary key for development.")
    else:
        logger.warning("No ENCRYPTION_KEY found in production. AWS credentials encryption will fail.")
        # We must have a valid 32 url-safe base64-encoded bytes string
        ENCRYPTION_KEY = Fernet.generate_key().decode()

cipher_suite = Fernet(ENCRYPTION_KEY.encode())

def encrypt_value(value: str) -> str:
    """Encrypt a plaintext string."""
    if not value:
        return ""
    return cipher_suite.encrypt(value.encode()).decode()

def decrypt_value(encrypted_value: str) -> str:
    """Decrypt an encrypted string."""
    if not encrypted_value:
        return ""
    try:
        return cipher_suite.decrypt(encrypted_value.encode()).decode()
    except Exception as e:
        logger.error(f"Decryption failed: {e}")
        return ""
