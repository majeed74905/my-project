import resend
from app.core.config import settings
from app.email.base import EmailProvider
import logging

logger = logging.getLogger(__name__)

class ResendProvider(EmailProvider):
    def __init__(self):
        if settings.RESEND_API_KEY:
            resend.api_key = settings.RESEND_API_KEY
        else:
            logger.warning("RESEND_API_KEY is not set.")

    def send(self, to_email: str, subject: str, html_content: str) -> bool:
        if not settings.RESEND_API_KEY:
            logger.error("Attempted to send email via Resend without API Key.")
            return False
            
        try:
            # Use onboarding@resend.dev for testing/reliability if domain not verified
            # from_email = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>" if settings.EMAILS_FROM_EMAIL else "Zara AI <noreply@zara-ai.com>"
            from_email = "onboarding@resend.dev"
            
            params = {
                "from": from_email,
                "to": [to_email],
                "subject": subject,
                "html": html_content
            }
            
            r = resend.Emails.send(params)
            # Resend returns a dict with 'id' on success
            if r and 'id' in r:
                logger.info(f"Email sent via Resend to {to_email} (ID: {r['id']})")
                return True
            else:
                logger.error(f"Resend API returned unexpected response: {r}")
                return False
                
        except Exception as e:
            logger.error(f"Resend Provider Failed: {str(e)}")
            return False
