from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.core.deps import get_db
from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    MessageResponse
)
from app.models.user import User
from app.services.rbac_service import get_user_permissions
from jose import jwt, JWTError
from app.core.config import settings

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """User login endpoint"""
    # Find user by email (across all agencies)
    user = db.query(User).filter(User.email == login_data.email).first()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    # Get user permissions
    permissions = get_user_permissions(user, db)

    # Create token claims with user metadata
    claims = {
        "email": user.email,
        "full_name": user.full_name,
        "agency_id": user.agency_id,
        "is_superuser": user.is_superuser,
        "permissions": permissions
    }

    # Create tokens with user metadata
    access_token = create_access_token(subject=user.id, additional_claims=claims)
    refresh_token = create_refresh_token(subject=user.id, additional_claims=claims)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(refresh_data: RefreshRequest, db: Session = Depends(get_db)):
    """Refresh access token using refresh token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh token",
    )

    try:
        payload = jwt.decode(
            refresh_data.refresh_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")

        if user_id is None or token_type != "refresh":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        raise credentials_exception

    # Get user permissions
    permissions = get_user_permissions(user, db)

    # Create token claims with user metadata
    claims = {
        "email": user.email,
        "full_name": user.full_name,
        "agency_id": user.agency_id,
        "is_superuser": user.is_superuser,
        "permissions": permissions
    }

    # Create new tokens with user metadata
    access_token = create_access_token(subject=user.id, additional_claims=claims)
    new_refresh_token = create_refresh_token(subject=user.id, additional_claims=claims)

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
    )


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Send password reset email (stub for now)"""
    user = db.query(User).filter(User.email == request.email).first()

    # Always return success to avoid email enumeration
    # In production, send actual email here
    return MessageResponse(
        message="If the email exists, a password reset link has been sent"
    )


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using token (stub for now)"""
    # In production, validate token and update password
    # For now, just return success message
    return MessageResponse(message="Password reset successful")
