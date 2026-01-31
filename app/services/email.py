import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

def send_email(to_email: str, subject: str, body: str):
    if not settings.SMTP_SERVER or not settings.SMTP_USER:
        print(f"MOCK EMAIL to {to_email}: {subject}")
        return

    msg = MIMEMultipart()
    msg['From'] = f"{settings.EMAILS_FROM_NAME or 'Zara AI'} <{settings.EMAILS_FROM_EMAIL}>"
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'html'))

    try:
        print(f"DEBUG: Connecting to {settings.SMTP_SERVER}:{settings.SMTP_PORT} (Secure: {settings.SMTP_SECURE})...")
        if settings.SMTP_SECURE:
            server = smtplib.SMTP_SSL(settings.SMTP_SERVER, settings.SMTP_PORT, timeout=15)
        else:
            server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT, timeout=15)
            server.starttls()
            
        print(f"DEBUG: Logging in as {settings.SMTP_USER}...")
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.EMAILS_FROM_EMAIL, to_email, msg.as_string())
        server.quit()
        print(f"SUCCESS: Email sent to {to_email}")
    except Exception as e:
        print(f"SMTP ERROR for {to_email}: {str(e)}")


def send_otp_email(to_email: str, otp: str):
    subject = "Your Zara AI Verification Code"
    body = f"""
    <html>
        <body>
            <h2>Welcome to Zara AI</h2>
            <p>Your verification code is: <strong>{otp}</strong></p>
            <p>This code expires in 10 minutes.</p>
        </body>
    </html>
    """
    send_email(to_email, subject, body)

def send_reset_password_email(to_email: str, token: str):
    # In a real app, this would be a link to the frontend
    # e.g., https://zara-ai.com/reset-password?token=...
    subject = "Reset Your Password"
    body = f"""
    <html>
        <body>
            <h2>Reset Password</h2>
            <p>Use this token to reset your password: <strong>{token}</strong></p>
            <p>If you did not request this, please ignore this email.</p>
        </body>
    </html>
    """
    send_email(to_email, subject, body)
