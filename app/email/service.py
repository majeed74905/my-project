from typing import Optional
from app.email.resend_provider import ResendProvider
from app.email.brevo_provider import BrevoProvider
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.resend = ResendProvider()
        self.brevo = BrevoProvider()

    def _send_critical(self, to_email: str, subject: str, html_content: str) -> bool:
        """
        Sends critical emails (Auth).
        Strategy: Resend -> Fallback to Brevo
        """
        # Try Resend First
        if self.resend.send(to_email, subject, html_content):
            return True
        
        logger.warning(f"Resend failed for critical email to {to_email}. Falling back to Brevo.")
        
        # Fallback to Brevo
        return self.brevo.send(to_email, subject, html_content)

    def _send_notification(self, to_email: str, subject: str, html_content: str) -> bool:
        """
        Sends non-critical emails (Notifications).
        Strategy: Brevo Only (Save Resend/API limits)
        """
        result = self.brevo.send(to_email, subject, html_content)
        if not result:
            logger.error(f"Failed to send notification email to {to_email} via Brevo.")
        return result

    def send_verification_email(self, email: str, otp: str):
        subject = "Verify your email - Zara AI"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: sans-serif; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .btn {{ background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; }}
                .footer {{ margin-top: 30px; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Welcome to Zara AI!</h2>
                <p>Please verify your email address to continue.</p>
                <p>Your Verification Code is:</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; color: #7c3aed;">
                    {otp}
                </div>
                <p>This code will expire in 10 minutes.</p>
                <div class="footer">
                    <p>If you didn't request this, you can safely ignore this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
        return self._send_critical(email, subject, html_content)

    def send_reset_password_email(self, email: str, token: str):
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        print(f"TESTING: Reset Link: {reset_link}", flush=True)
        if "reset-password" not in settings.FRONTEND_URL:
             # Just in case FRONTEND_URL is just the domain
             pass

        subject = "Reset your password - Zara AI"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>Reset Your Password</h2>
                <p>We received a request to reset your password. Click the button below to choose a new one:</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
                </p>
                <p>Or paste this link in your browser:</p>
                <p style="color: #666; font-size: 14px; word-break: break-all;">{reset_link}</p>
                <p>If you didn't ask for this, ignore this email.</p>
            </div>
        </body>
        </html>
        """
        return self._send_critical(email, subject, html_content)
    
    def send_welcome_email(self, email: str, name: str):
        subject = "Welcome to Zara AI!"
        html_content = f"""
        <html>
        <body>
            <h1>Welcome, {name}!</h1>
            <p>We're excited to have you on board.</p>
            <p>Zara AI is your new personal assistant. Explore the dashboard to get started.</p>
        </body>
        </html>
        """
        return self._send_notification(email, subject, html_content)

    def send_verification_email_link(self, email: str, token: str):
        # Link points to frontend verification page
        verify_link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        verify_link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        print(f"TESTING: Verification Link: {verify_link}", flush=True)
        
        subject = "Verify your email - Zara AI"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: sans-serif; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .btn {{ background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Welcome to Zara AI!</h2>
                <p>Please verify your email address to continue.</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="{verify_link}" class="btn">Verify Email</a>
                </p>
                <p>Or paste this link: {verify_link}</p>
                <p>This link expires in 24 hours.</p>
            </div>
        </body>
        </html>
        """
        return self._send_critical(email, subject, html_content)
        
    def send_otp_email(self, email: str, otp: str):
        """
        Alias for send_verification_email to match existing interface in api/auth.py
        """
        return self.send_verification_email(email, otp)
        
    def send_reset_password_email_alias(self, email: str, token: str):
         # The existing code calls send_reset_password_email, so the method above is fine. 
         # I just need to make sure the arguments match the existing call.
         return self.send_password_reset_email(email, token)

email_service = EmailService()
