"""
Configuration settings for the K8s Dashboard Backend
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "K8s Dashboard API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # API Configuration
    API_V1_PREFIX: str = "/api/v1"
    
    # CORS
    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:3001", "http://127.0.0.1:3002", "http://127.0.0.1:3003"]
    
    # Kubernetes Configuration
    K8S_IN_CLUSTER: bool = False  # Set to True when running inside K8s
    K8S_CONFIG_PATH: Optional[str] = None  # Path to kubeconfig file
    K8S_NAMESPACE: str = "default"
    
    # Project/Namespace Management
    ALLOW_NAMESPACE_CREATION: bool = False  # Don't auto-create namespaces for bachelor thesis
    DEFAULT_NAMESPACE: str = "default"
    
    # Session Configuration  
    SESSION_TIMEOUT_MINUTES: int = 480  # 8 hours
    
    # Anomaly Detection Settings
    ANOMALY_CONTAMINATION: float = 0.1  # Expected proportion of outliers
    ANOMALY_N_ESTIMATORS: int = 100  # Number of trees in Isolation Forest
    ANOMALY_CHECK_INTERVAL: int = 60  # Seconds between anomaly checks
    
    # Metrics Collection
    METRICS_RETENTION_HOURS: int = 24
    METRICS_COLLECTION_INTERVAL: int = 15  # Seconds
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # WebSocket
    WS_HEARTBEAT_INTERVAL: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()
