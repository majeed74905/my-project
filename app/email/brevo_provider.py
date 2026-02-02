import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
from app.email.base import EmailProvider
import logging

logger = logging.getLogger(__name__)

class BrevoProvider(EmailProvider):
    def send(self, to_email: str, subject: str, html_content: str) -> bool:
        if not settings.BREVO_SMTP_USER or not settings.BREVO_SMTP_PASS:
             logger.warning("Brevo SMTP credentials missing.")
             return False
        
        msg = MIMEMultipart()
        msg['From'] = f"{settings.EMAILS_FROM_NAME or 'Zara AI'} <{settings.EMAILS_FROM_EMAIL or 'noreply@example.com'}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(html_content, 'html'))

        try:
            # Brevo uses port 587 for TLS
            server = smtplib.SMTP(settings.BREVO_SMTP_HOST, settings.BREVO_SMTP_PORT, timeout=10)
            server.starttls()
            server.login(settings.BREVO_SMTP_USER, settings.BREVO_SMTP_PASS)
            server.sendmail(settings.EMAILS_FROM_EMAIL or settings.BREVO_SMTP_USER, to_email, msg.as_string())
            server.quit()
            logger.info(f"Email sent via Brevo SMTP to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Brevo SMTP Failed for {to_email}: {str(e)}")
            return False
