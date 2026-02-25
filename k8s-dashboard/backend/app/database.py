"""
Database Configuration and Models
Multi-user, Multi-cluster support with SQLAlchemy
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
import os

# Database URL - Use SQLite for development, PostgreSQL for production
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./k8s_dashboard.db")

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


class User(Base):
    """User model for authentication and authorization"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="user", nullable=False)  # admin, user
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    clusters = relationship("Cluster", back_populates="owner", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")


class Cluster(Base):
    """Cluster model for per-user Kubernetes cluster configuration"""
    __tablename__ = "clusters"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    
    # Encrypted kubeconfig or API server credentials
    encrypted_kubeconfig = Column(Text, nullable=True)  # Encrypted full kubeconfig
    api_server_url = Column(String(255), nullable=True)  # Alternative: API server URL
    encrypted_token = Column(Text, nullable=True)  # Alternative: Encrypted token
    
    # RBAC and namespace restrictions
    allowed_namespaces = Column(JSON, nullable=True, default=list)  # List of allowed namespaces, empty = all
    is_namespace_restricted = Column(Boolean, default=False)
    
    # Metadata
    is_active = Column(Boolean, default=True)
    last_connected = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner = relationship("User", back_populates="clusters")
    audit_logs = relationship("AuditLog", back_populates="cluster", cascade="all, delete-orphan")


class AuditLog(Base):
    """Audit log model for tracking user actions"""
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    cluster_id = Column(Integer, ForeignKey("clusters.id"), nullable=True)
    
    # Action details
    action = Column(String(100), nullable=False)  # e.g., "delete_pod", "scale_deployment"
    resource_type = Column(String(50), nullable=True)  # e.g., "pod", "deployment"
    resource_name = Column(String(255), nullable=True)
    namespace = Column(String(100), nullable=True)
    
    # Additional context
    details = Column(JSON, nullable=True)  # Additional metadata
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(255), nullable=True)
    
    # Result
    status = Column(String(20), nullable=False)  # success, failed, error
    error_message = Column(Text, nullable=True)
    
    # Timestamp
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
    cluster = relationship("Cluster", back_populates="audit_logs")


def get_db() -> Session:
    """
    Database session dependency
    Usage: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
    print("Database initialized successfully")


def create_default_admin(db: Session):
    """Create default admin user if not exists"""
    from app.utils.security import hash_password
    
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        admin = User(
            username="admin",
            email="admin@k8s-dashboard.com",
            hashed_password=hash_password("admin"),
            role="admin",
            is_active=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"Default admin user created: {admin.username}")
    return admin


if __name__ == "__main__":
    # Initialize database when run directly
    init_db()
    db = SessionLocal()
    try:
        create_default_admin(db)
    finally:
        db.close()
