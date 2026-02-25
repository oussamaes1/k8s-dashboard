"""
FastAPI Main Application
Kubernetes Cluster Monitoring and Management Dashboard
Multi-User, Multi-Cluster Support
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.routes import cluster, metrics, logs, alerts, auth
from app.services.anomaly_detector import AnomalyDetector
from app.services.kubernetes_service import KubernetesService
from app.middleware import UserContextMiddleware, ClusterIsolationMiddleware
from app.database import init_db, SessionLocal, create_default_admin

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format=settings.LOG_FORMAT
)
logger = logging.getLogger(__name__)

# Global services (for backward compatibility with demo mode)
k8s_service: KubernetesService = None
anomaly_detector: AnomalyDetector = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    global k8s_service, anomaly_detector
    
    logger.info("Starting K8s Dashboard API...")
    
    # Initialize database
    try:
        init_db()
        logger.info("Database initialized successfully")
        
        # Create default admin user
        db = SessionLocal()
        try:
            create_default_admin(db)
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
    
    # Initialize global Kubernetes service (for demo/fallback)
    k8s_service = KubernetesService(
        in_cluster=settings.K8S_IN_CLUSTER,
        config_path=settings.K8S_CONFIG_PATH
    )
    
    # Initialize Anomaly Detector
    anomaly_detector = AnomalyDetector(
        contamination=settings.ANOMALY_CONTAMINATION,
        n_estimators=settings.ANOMALY_N_ESTIMATORS
    )
    
    # Store in app state
    app.state.k8s_service = k8s_service
    app.state.anomaly_detector = anomaly_detector
    
    logger.info("K8s Dashboard API started successfully")
    
    yield
    
    # Cleanup
    logger.info("Shutting down K8s Dashboard API...")


# Create FastAPI application with redirect_slashes=False to prevent Authorization header loss
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="A smart, web-based dashboard for Kubernetes cluster monitoring and management with AI-powered anomaly detection",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    redirect_slashes=False
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom middleware for user context and cluster isolation
app.add_middleware(UserContextMiddleware)
app.add_middleware(ClusterIsolationMiddleware)

# Include API routes
app.include_router(
    auth.router,
    prefix=f"{settings.API_V1_PREFIX}/auth",
    tags=["Authentication"]
)

# Multi-cluster management routes
from app.api.routes import clusters
app.include_router(
    clusters.router,
    prefix=f"{settings.API_V1_PREFIX}/clusters",
    tags=["Cluster Management"]
)
app.include_router(
    cluster.router,
    prefix=f"{settings.API_V1_PREFIX}/cluster",
    tags=["Cluster"]
)
app.include_router(
    metrics.router,
    prefix=f"{settings.API_V1_PREFIX}/metrics",
    tags=["Metrics"]
)
app.include_router(
    logs.router,
    prefix=f"{settings.API_V1_PREFIX}/logs",
    tags=["Logs"]
)
app.include_router(
    alerts.router,
    prefix=f"{settings.API_V1_PREFIX}/alerts",
    tags=["Alerts"]
)

# Import and include namespaces router
from app.api.routes import namespaces
app.include_router(
    namespaces.router,
    prefix=f"{settings.API_V1_PREFIX}/namespaces",
    tags=["Namespaces"]
)


@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - API health check"""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "message": "K8s Dashboard API is running"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "kubernetes_connected": k8s_service.is_connected() if k8s_service else False,
        "anomaly_detector_ready": anomaly_detector.is_ready() if anomaly_detector else False
    }
