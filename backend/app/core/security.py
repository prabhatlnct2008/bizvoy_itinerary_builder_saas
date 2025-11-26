from datetime import datetime, timedelta
from typing import Any, Union, Dict, Optional
from jose import jwt
from app.core.config import settings

# Try to initialize bcrypt, handle Python 3.14 compatibility issues
try:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    BCRYPT_AVAILABLE = True
except (ImportError, ValueError) as e:
    BCRYPT_AVAILABLE = False
    pwd_context = None
    print(f"Warning: bcrypt not available ({e}). Password verification will use simple comparison.")


def create_access_token(
    subject: Union[str, Any],
    expires_delta: timedelta = None,
    additional_claims: Optional[Dict[str, Any]] = None
) -> str:
    """Create JWT access token with optional additional claims"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {"exp": expire, "sub": str(subject)}

    # Add additional claims if provided
    if additional_claims:
        to_encode.update(additional_claims)

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(
    subject: Union[str, Any],
    additional_claims: Optional[Dict[str, Any]] = None
) -> str:
    """Create JWT refresh token with optional additional claims"""
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}

    # Add additional claims if provided
    if additional_claims:
        to_encode.update(additional_claims)

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    if BCRYPT_AVAILABLE and pwd_context:
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception as e:
            # If bcrypt verification fails (e.g., plaintext password in DB),
            # fall back to simple comparison
            print(f"Bcrypt verification failed ({e}), using plaintext comparison")
            return plain_password == hashed_password
    else:
        # Fallback for Python 3.14 compatibility: simple comparison
        # In production, this should use a proper password hash verification
        return plain_password == hashed_password


def get_password_hash(password: str) -> str:
    """Hash a password"""
    if BCRYPT_AVAILABLE and pwd_context:
        return pwd_context.hash(password)
    else:
        # Fallback for Python 3.14 compatibility: return plaintext
        # In production, this should use a proper password hash
        print("Warning: Returning plaintext password (bcrypt not available)")
        return password
