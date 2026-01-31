from datetime import timedelta, datetime
import random
import string
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, EmailVerification, RefreshToken, ActivityLog
from app.schemas import user as user_schemas, token as token_schemas
from app.core import security, jwt
from app.core.config import settings
from app.services import email as email_service
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import httpx

router = APIRouter()

from typing import Optional
from app.api import deps
@router.get("/status")
def get_auth_status(current_user: Optional[User] = Depends(deps.get_current_user_optional)):
    """Feature 07: Lightweight endpoint to verify auth state."""
    if current_user:
        return {"authenticated": True, "email": current_user.email}
    return {"authenticated": False, "email": None}

class GoogleLogin(token_schemas.BaseModel):
    token: str

@router.get("/google/login")
async def google_login_init():
    """Redirects user to Google OAuth login page."""
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CALLBACK_URL:
         raise HTTPException(status_code=400, detail="Google OAuth not configured")
         
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_CALLBACK_URL,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account"
    }
    url = f"https://accounts.google.com/o/oauth2/v2/auth?{httpx.QueryParams(params)}"
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url)

@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    """Handles the callback from Google, exchanges code for token, and redirects to frontend."""
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET or not settings.GOOGLE_CALLBACK_URL:
        raise HTTPException(status_code=400, detail="Google OAuth not configured")

    async with httpx.AsyncClient() as client:
        # 1. Exchange code for tokens
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_CALLBACK_URL,
                "grant_type": "authorization_code",
            },
        )
        
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange Google code")
            
        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        
        # 2. Get user info
        user_resp = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if user_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info from Google")
            
        user_data = user_resp.json()
        email = user_data['email']
        full_name = user_data.get('name') or user_data.get('given_name', "")

        # 3. Create or login user
        user = db.query(User).filter(User.email == email).first()
        if not user:
            random_pw = ''.join(random.choices(string.ascii_letters + string.digits, k=24))
            user = User(
                email=email,
                hashed_password=security.get_password_hash(random_pw),
                full_name=full_name,
                is_active=True,
                is_verified=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            log = ActivityLog(user_id=user.id, action="REGISTER_GOOGLE", details="User registered via Google Callback")
        else:
            log = ActivityLog(user_id=user.id, action="LOGIN_GOOGLE", details="User logged in via Google Callback")
        
        db.add(log)
        db.commit()

        # 4. Create App tokens
        app_access_token = jwt.create_access_token(
            subject=user.id, expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        # 5. Redirect to frontend with token
        from fastapi.responses import RedirectResponse
        frontend_redirect_url = f"{settings.FRONTEND_URL}/auth/success?token={app_access_token}&email={email}"
        return RedirectResponse(frontend_redirect_url)

@router.post("/google", response_model=token_schemas.Token)
async def google_login_post(
    login_in: GoogleLogin,
    db: Session = Depends(get_db)
):
    try:
        # Keep existing POST flow for client-side libraries
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {login_in.token}"}
            )
            
            if resp.status_code != 200:
                try:
                    idinfo = id_token.verify_oauth2_token(
                        login_in.token, 
                        google_requests.Request(), 
                        settings.GOOGLE_CLIENT_ID
                    )
                    user_data = idinfo
                except Exception as ve:
                    raise HTTPException(status_code=400, detail=f"Invalid Google token: {str(ve)}")
            else:
                user_data = resp.json()

        email = user_data['email']
        full_name = user_data.get('name') or user_data.get('given_name', "")

        user = db.query(User).filter(User.email == email).first()
        if not user:
            random_pw = ''.join(random.choices(string.ascii_letters + string.digits, k=24))
            user = User(
                email=email,
                hashed_password=security.get_password_hash(random_pw),
                full_name=full_name,
                is_active=True,
                is_verified=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        app_access_token = jwt.create_access_token(
            subject=user.id, expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        refresh_token = jwt.create_refresh_token(subject=user.id)
        
        db_token = RefreshToken(
            user_id=user.id,
            token=refresh_token,
            expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        db.add(db_token)
        db.commit()
        
        return {
            "access_token": app_access_token, 
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "email": email
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid Google token: {str(e)}")



def generate_otp(length=6):
    return ''.join(random.choices(string.digits, k=length))

@router.post("/register", response_model=user_schemas.UserResponse)
async def register(
    user_in: user_schemas.UserCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    
    user = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        is_verified=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate OTP
    otp = generate_otp()
    otp_entry = EmailVerification(
        user_id=user.id,
        otp_code=otp,
        expires_at=datetime.utcnow() + timedelta(minutes=10)
    )
    db.add(otp_entry)
    db.commit()

    # Send Email in background
    background_tasks.add_task(email_service.send_otp_email, user.email, otp)

    # Log Activity
    log = ActivityLog(user_id=user.id, action="REGISTER", details="User registered")
    db.add(log)
    db.commit()
    
    return user

@router.post("/verify-email")
def verify_email(
    verify_in: user_schemas.OTPVerify,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == verify_in.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    otp_record = db.query(EmailVerification).filter(
        EmailVerification.user_id == user.id,
        EmailVerification.otp_code == verify_in.otp,
        EmailVerification.expires_at > datetime.utcnow()
    ).first()

    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    user.is_verified = True
    db.delete(otp_record) # Consume OTP
    
    log = ActivityLog(user_id=user.id, action="EMAIL_VERIFIED", details="Email verified successfully")
    db.add(log)
    db.commit()

    return {"msg": "Email verified successfully"}

@router.post("/resend-otp")
def resend_otp(
    email_req: user_schemas.EmailRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == email_req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_verified:
        return {"message": "User is already verified"}
    
    # Generate new OTP
    otp = generate_otp()
    
    # Update or create OTP entry
    otp_record = db.query(EmailVerification).filter(EmailVerification.user_id == user.id).first()
    if otp_record:
        otp_record.otp_code = otp
        otp_record.expires_at = datetime.utcnow() + timedelta(minutes=10)
    else:
        otp_record = EmailVerification(
            user_id=user.id,
            otp_code=otp,
            expires_at=datetime.utcnow() + timedelta(minutes=10)
        )
        db.add(otp_record)
    
    # Send Email in background
    background_tasks.add_task(email_service.send_otp_email, user.email, otp)
    
    log = ActivityLog(user_id=user.id, action="RESEND_OTP", details="OTP resent")
    db.add(log)
    db.commit()
    
    return {"message": "Verification code resent successfully"}

@router.post("/login", response_model=token_schemas.Token)
async def login(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), 
    form_data: OAuth2PasswordRequestForm = Depends()
):
    user = db.query(User).filter(User.email == form_data.username).first()
    
    # Check if locked
    if user and user.locked_until and user.locked_until > datetime.utcnow():
        raise HTTPException(status_code=400, detail="Account locked. Try again later.")

    if not user or not security.verify_password(form_data.password, user.hashed_password):
        # Handle failed attempts
        if user:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                user.locked_until = datetime.utcnow() + timedelta(minutes=15)
                # Should send email warning here
                
                log = ActivityLog(user_id=user.id, action="ACCOUNT_LOCKED", details="Too many failed attempts")
                db.add(log)
            else:
                 log = ActivityLog(user_id=user.id, action="LOGIN_FAILED", details="Incorrect password")
                 db.add(log)
            db.commit()
            
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    if not user.is_verified:
        raise HTTPException(status_code=400, detail="Email not verified")

    user.failed_login_attempts = 0
    user.locked_until = None
    
    log = ActivityLog(user_id=user.id, action="LOGIN", details="Successful login")
    db.add(log)
    db.commit()
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = jwt.create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    refresh_token = jwt.create_refresh_token(
        subject=user.id
    )
    
    # Store refresh token
    db_token = RefreshToken(
        user_id=user.id,
        token=refresh_token,
        expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(db_token)
    db.commit()
    
    return {
        "access_token": access_token, 
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/forgot-password")
def forgot_password(
    email_req: user_schemas.EmailRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == email_req.email).first()
    if not user:
        # Return success even if email not found to prevent enumeration
        return {"msg": "If this email exists, a password reset link has been sent."}
    
    # Generate a reset token (reusing OTP logic or a specialized token)
    # For simplicity in this flow, we will generate a 60-min access token
    # In a stricter system, use a specific 'reset' type token in specific table
    
    reset_token = jwt.create_access_token(
        subject=user.id, expires_delta=timedelta(minutes=60)
    )
    
    # Store token in log or just rely on stateless JWT?
    # Stateless is fine here as long as we verify the type or claim
    
    background_tasks.add_task(email_service.send_reset_password_email, user.email, reset_token)
    
    log = ActivityLog(user_id=user.id, action="FORGOT_PASSWORD_REQUEST", details="Reset link requested")
    db.add(log)
    db.commit()
    
    return {"msg": "If this email exists, a password reset link has been sent."}

@router.post("/reset-password")
def reset_password(
    reset_in: user_schemas.PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.jwt.decode(reset_in.token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
             raise HTTPException(status_code=400, detail="Invalid token")
    except jwt.JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
        
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.hashed_password = security.get_password_hash(reset_in.new_password)
    
    # Log global logout (revoke tokens)? 
    # For now just log usage
    log = ActivityLog(user_id=user.id, action="PASSWORD_RESET", details="Password reset successfully")
    db.add(log)
    db.commit()
    
    return {"msg": "Password updated successfully"}
