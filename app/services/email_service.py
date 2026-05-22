"""
Email service – send OTP verification emails via SMTP.
Includes dev-mode console fallback and detailed error logging.
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.core.config import settings
from app.core.logger import logger


def _log_otp_to_console(to_email: str, otp: str) -> None:
    """Print OTP to server console for dev/testing when SMTP is unavailable."""
    logger.info(
        "\n"
        "╔══════════════════════════════════════════╗\n"
        "║        DEV MODE — OTP FALLBACK           ║\n"
        "╠══════════════════════════════════════════╣\n"
        f"║  Email : {to_email:<30} ║\n"
        f"║  OTP   : {otp:<30} ║\n"
        "║  Expiry: 10 minutes                      ║\n"
        "╚══════════════════════════════════════════╝"
    )


def send_otp_email(to_email: str, otp: str) -> bool:
    """
    Send a 6-digit OTP to the given email address.

    - On success → returns True, logs confirmation.
    - On failure → returns False, logs full error.
    - In dev mode or when SMTP is not configured → always prints OTP to console.
    """
    # ── Dev fallback: always log OTP to console in development ──
    if settings.is_dev:
        _log_otp_to_console(to_email, otp)

    # ── Skip actual send if SMTP is not configured ──
    if not settings.smtp_configured:
        logger.warning(
            f"SMTP not configured — skipping email to {to_email}. "
            "Set SMTP_USER and SMTP_PASSWORD in .env to enable."
        )
        return False

    subject = "Cloud Autopilot – Verify Your Email"

    # HTML email body
    html_body = f"""\
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #6366f1); padding: 12px; border-radius: 12px;">
                <span style="font-size: 24px; color: white;">🛡️</span>
            </div>
        </div>
        <h2 style="text-align: center; color: #1e293b; margin-bottom: 8px;">Verify Your Email</h2>
        <p style="text-align: center; color: #64748b; font-size: 14px; margin-bottom: 28px;">
            Use the code below to complete your Cloud Autopilot registration.
        </p>
        <div style="text-align: center; background: white; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1e293b;">{otp}</span>
        </div>
        <p style="text-align: center; color: #94a3b8; font-size: 12px;">
            This code expires in <strong>10 minutes</strong>. If you didn't request this, ignore this email.
        </p>
    </div>
    """

    # Plain text fallback
    text_body = f"Your Cloud Autopilot verification code is: {otp}\n\nThis code expires in 10 minutes."

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to_email
    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        logger.info(f"Connecting to SMTP server {settings.SMTP_HOST}:{settings.SMTP_PORT}...")
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.ehlo()
            logger.info("Starting TLS...")
            server.starttls()
            server.ehlo()
            logger.info(f"Authenticating as {settings.SMTP_USER}...")
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())

        logger.info(f"[SUCCESS] OTP email sent successfully to {to_email}")
        return True

    except smtplib.SMTPAuthenticationError as e:
        logger.error(
            f"[ERROR] SMTP auth failed for {settings.SMTP_USER}: {e}. "
            "Check SMTP_USER and SMTP_PASSWORD in .env (use Gmail App Password)."
        )
    except smtplib.SMTPConnectError as e:
        logger.error(f"[ERROR] Cannot connect to SMTP server {settings.SMTP_HOST}:{settings.SMTP_PORT}: {e}")
    except smtplib.SMTPException as e:
        logger.error(f"[ERROR] SMTP error sending to {to_email}: {e}")
    except TimeoutError:
        logger.error(f"[ERROR] SMTP connection to {settings.SMTP_HOST}:{settings.SMTP_PORT} timed out.")
    except Exception as e:
        logger.error(f"[ERROR] Unexpected email error to {to_email}: {type(e).__name__}: {e}")

    return False


def send_email(to_email: str, subject: str, body: str) -> bool:
    """
    Send a generic plain-text email (used for alerts, notifications, etc.).
    Returns True on success, False on failure. Never raises.
    """
    if not settings.smtp_configured:
        logger.warning(
            f"SMTP not configured — skipping alert email to {to_email}."
        )
        if settings.is_dev:
            logger.info(f"[DEV] Alert email to {to_email}: {subject}")
        return False

    msg = MIMEText(body, "plain")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to_email

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())
        logger.info(f"[SUCCESS] Alert email sent to {to_email}: {subject}")
        return True
    except Exception as e:
        logger.error(f"[ERROR] Failed to send alert email to {to_email}: {type(e).__name__}: {e}")
        return False
