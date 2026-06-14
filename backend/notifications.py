"""Email / WhatsApp / Twilio notification helpers.

These are env-gated — if the credentials are missing the helpers silently
log and return.  This lets the app run with zero third-party setup.
"""
from __future__ import annotations

import logging
import os
import smtplib
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)


def email_enabled() -> bool:
    if os.environ.get("SENDGRID_API_KEY"):
        return True
    if os.environ.get("SMTP_HOST") and os.environ.get("SMTP_USER"):
        return True
    return False


def send_email(to_email: str, subject: str, body: str) -> bool:
    """Best-effort email sender.  Returns True if the email was dispatched."""
    if not to_email:
        return False
    from_email = os.environ.get("EMAIL_FROM") or "no-reply@tagit.in"

    sendgrid_key = os.environ.get("SENDGRID_API_KEY")
    if sendgrid_key:
        try:
            import requests

            requests.post(
                "https://api.sendgrid.com/v3/mail/send",
                headers={
                    "Authorization": f"Bearer {sendgrid_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "personalizations": [{"to": [{"email": to_email}]}],
                    "from": {"email": from_email},
                    "subject": subject,
                    "content": [{"type": "text/plain", "value": body}],
                },
                timeout=8,
            )
            return True
        except Exception as exc:  # noqa: BLE001
            logger.warning("SendGrid send failed: %s", exc)
            return False

    smtp_host = os.environ.get("SMTP_HOST")
    if smtp_host and os.environ.get("SMTP_USER"):
        try:
            msg = MIMEText(body)
            msg["Subject"] = subject
            msg["From"] = from_email
            msg["To"] = to_email
            with smtplib.SMTP(smtp_host, int(os.environ.get("SMTP_PORT", "587"))) as s:
                s.starttls()
                s.login(os.environ["SMTP_USER"], os.environ.get("SMTP_PASS", ""))
                s.sendmail(from_email, [to_email], msg.as_string())
            return True
        except Exception as exc:  # noqa: BLE001
            logger.warning("SMTP send failed: %s", exc)
            return False

    logger.info("Email skipped (no provider configured) to=%s subj=%s", to_email, subject)
    return False


def whatsapp_enabled() -> bool:
    return bool(os.environ.get("WHATSAPP_API_KEY"))


def twilio_enabled() -> bool:
    return bool(os.environ.get("TWILIO_ACCOUNT_SID") and os.environ.get("TWILIO_AUTH_TOKEN"))
