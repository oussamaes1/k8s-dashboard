"""
Authentication Routes with Role-Based Access Control
"""
from datetime import datetime, timedelta
from typing import Optional, List
import hashlib
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
import jwt

from app.database import get_db, User
from app.utils.security import hash_password as security_hash_password, verify_password as security_verify_password

router = APIRouter()
security = HTTPBearer(auto_error=False)

# Configuration
SECRET_KEY = "your-secret-key-change-in-production-use-env-variable"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours

# Simple password hashing function
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

# Demo users database (in production, use a proper database)
USERS_DB = {
    "admin": {
        "username": "admin",
        "email": "admin@k8s-dashboard.com",
        "hashed_password": hash_password("admin"),
        "role": "admin",
        "is_active": True,
        "created_at": "2026-01-20T10:00:00"
    },
    "user": {
        "username": "user",
        "email": "user@k8s-dashboard.com",
        "hashed_password": hash_password("user"),
        "role": "user",
        "is_active": True,
        "created_at": "2026-01-21T14:30:00"
    },
    "john": {
        "username": "john",
        "email": "john@k8s-dashboard.com",
        "hashed_password": hash_password("john"),
        "role": "user",
        "is_active": True,
        "created_at": "2026-01-22T09:15:00"
    }
}

# User activity tracking (in production, use a proper database)
USER_ACTIVITY_DB = {
    "admin": {
        "pods_viewed": 12,
        "nodes_viewed": 5,
        "alerts_count": 3,
        "last_login": "2026-01-22T10:00:00",
        "recent_activity": [
            {
                "action": "Viewed pod details: nginx-deployment-xyz",
                "timestamp": "2 hours ago"
            },
            {
                "action": "Checked cluster metrics",
                "timestamp": "5 hours ago"
            }
        ]
    },
    "user": {
        "pods_viewed": 8,
        "nodes_viewed": 3,
        "alerts_count": 1,
        "last_login": "2026-01-21T14:30:00",
        "recent_activity": [
            {
                "action": "Checked cluster metrics",
                "timestamp": "1 day ago"
            }
        ]
    }
}


# Pydantic Models
class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    email: str
    role: str


class UserResponse(BaseModel):
    username: str
    email: str
    role: str
    is_active: bool
    created_at: Optional[str] = None


class UserCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    role: str = "user"


class UserUpdate(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class StatsResponse(BaseModel):
    total_users: int
    active_users: int
    admin_users: int
    regular_users: int


class UserStats(BaseModel):
    pods_viewed: int
    nodes_viewed: int
    alerts_count: int
    last_login: str


# Helper Functions
def get_password_hash(password: str) -> str:
    return security_hash_password(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        if credentials is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated"
            )
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )


def get_current_user(username: str = Depends(verify_token), db: Session = Depends(get_db)):
    """Get current authenticated user"""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


def verify_admin(username: str = Depends(verify_token), db: Session = Depends(get_db)):
    """Verify user has admin role"""
    user = db.query(User).filter(User.username == username).first()
    if not user or user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return username


# Authentication Endpoints
@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return JWT token with role"""
    # Query user from database
    user = db.query(User).filter(User.username == request.username).first()
    
    if not user or not security_verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=access_token_expires
    )
    
    return TokenResponse(
        access_token=access_token,
        username=user.username,
        email=user.email,
        role=user.role
    )


@router.get("/verify")
async def verify(username: str = Depends(verify_token), db: Session = Depends(get_db)):
    """Verify token validity"""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "username": username,
        "role": user.role,
        "valid": True
    }


@router.post("/logout")
async def logout(username: str = Depends(verify_token)):
    """Logout user (client-side token removal)"""
    return {"message": "Successfully logged out"}


# User Management Endpoints (Admin Only)
@router.get("/users", response_model=List[UserResponse])
async def get_users(username: str = Depends(verify_admin), db: Session = Depends(get_db)):
    """Get all users (Admin only)"""
    users = db.query(User).all()
    return [
        UserResponse(
            username=user.username,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at.isoformat() if user.created_at else None
        )
        for user in users
    ]


@router.post("/signup", response_model=UserResponse)
async def signup(user: UserCreate, db: Session = Depends(get_db)):
    """Public user registration - creates regular users"""
    # Check if username exists
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # Check if email already exists
    if user.email:
        existing_email = db.query(User).filter(User.email == user.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # Create new user (always regular user for public signup)
    new_user = User(
        username=user.username,
        email=user.email or f"{user.username}@k8s-dashboard.com",
        hashed_password=get_password_hash(user.password),
        role="user",  # Always user role for public signup
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return UserResponse(
        username=new_user.username,
        email=new_user.email,
        role=new_user.role,
        is_active=new_user.is_active,
        created_at=new_user.created_at.isoformat() if new_user.created_at else None
    )


@router.post("/register", response_model=UserResponse)
async def create_user(user: UserCreate, admin_username: str = Depends(verify_admin), db: Session = Depends(get_db)):
    """Create new user (Admin only) - can create admin or regular users"""
    # Check if username exists
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    if user.role not in ["admin", "user"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be 'admin' or 'user'"
        )
    
    # Create new user
    new_user = User(
        username=user.username,
        email=user.email or f"{user.username}@k8s-dashboard.com",
        hashed_password=get_password_hash(user.password),
        role=user.role,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return UserResponse(
        username=new_user.username,
        email=new_user.email,
        role=new_user.role,
        is_active=new_user.is_active,
        created_at=new_user.created_at.isoformat() if new_user.created_at else None
    )


@router.put("/users/{target_username}", response_model=UserResponse)
async def update_user(
    target_username: str,
    user_update: UserUpdate,
    admin_username: str = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Update user (Admin only)"""
    user = db.query(User).filter(User.username == target_username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_update.email:
        user.email = user_update.email
    if user_update.role and user_update.role in ["admin", "user"]:
        user.role = user_update.role
    if user_update.is_active is not None:
        user.is_active = user_update.is_active
    
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        username=user.username,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at.isoformat() if user.created_at else None
    )


@router.delete("/users/{target_username}")
async def delete_user(target_username: str, admin_username: str = Depends(verify_admin), db: Session = Depends(get_db)):
    """Delete user (Admin only)"""
    user = db.query(User).filter(User.username == target_username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if target_username == admin_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    db.delete(user)
    db.commit()
    return {"message": f"User {target_username} deleted successfully"}


@router.get("/stats", response_model=StatsResponse)
async def get_stats(username: str = Depends(verify_admin), db: Session = Depends(get_db)):
    """Get user statistics (Admin only)"""
    total = db.query(User).count()
    active = db.query(User).filter(User.is_active == True).count()
    admins = db.query(User).filter(User.role == "admin").count()
    regular = db.query(User).filter(User.role == "user").count()
    
    return StatsResponse(
        total_users=total,
        active_users=active,
        admin_users=admins,
        regular_users=regular
    )


# User-specific Endpoints
@router.get("/user-stats", response_model=UserStats)
async def get_user_stats(username: str = Depends(verify_token)):
    """Get current user's statistics"""
    # Get user-specific stats from activity database
    user_activity = USER_ACTIVITY_DB.get(username, {
        "pods_viewed": 0,
        "nodes_viewed": 0,
        "alerts_count": 0,
        "last_login": datetime.utcnow().isoformat()
    })
    
    return UserStats(
        pods_viewed=user_activity["pods_viewed"],
        nodes_viewed=user_activity["nodes_viewed"],
        alerts_count=user_activity["alerts_count"],
        last_login=user_activity["last_login"]
    )


@router.get("/recent-activity")
async def get_recent_activity(username: str = Depends(verify_token)):
    """Get user's recent activity"""
    # Get user-specific activity from database
    user_activity = USER_ACTIVITY_DB.get(username, {})
    return user_activity.get("recent_activity", [])
