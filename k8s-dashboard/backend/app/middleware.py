"""
Middleware for user context and cluster isolation
"""
from typing import Optional, Callable
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import logging

from app.services.cluster_manager import cluster_manager
from app.database import SessionLocal

logger = logging.getLogger(__name__)


class UserContextMiddleware(BaseHTTPMiddleware):
    """
    Middleware to attach user context to requests
    
    Extracts cluster_id from request and validates user access
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and attach user context"""
        
        # Attach database session to request
        request.state.db = SessionLocal()
        
        try:
            # Process request
            response = await call_next(request)
            return response
            
        finally:
            # Clean up database session
            if hasattr(request.state, 'db'):
                request.state.db.close()


class ClusterIsolationMiddleware(BaseHTTPMiddleware):
    """
    Middleware to enforce cluster isolation per user
    
    Validates that users can only access their own clusters
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Enforce cluster isolation"""
        
        # Skip middleware for non-API routes
        if not request.url.path.startswith("/api/"):
            return await call_next(request)
        
        # Skip for auth routes
        if "/auth/" in request.url.path or "/login" in request.url.path or "/signup" in request.url.path:
            return await call_next(request)
        
        # Extract cluster_id from query params or path
        cluster_id = None
        
        # Check query parameters
        if "cluster_id" in request.query_params:
            try:
                cluster_id = int(request.query_params["cluster_id"])
            except ValueError:
                pass
        
        # Check path parameters (e.g., /clusters/{cluster_id})
        path_parts = request.url.path.split("/")
        if "clusters" in path_parts:
            try:
                idx = path_parts.index("clusters")
                if idx + 1 < len(path_parts) and path_parts[idx + 1].isdigit():
                    cluster_id = int(path_parts[idx + 1])
            except (ValueError, IndexError):
                pass
        
        # If cluster_id is specified, store it in request state
        if cluster_id:
            request.state.cluster_id = cluster_id
        
        # Continue processing
        response = await call_next(request)
        return response


def get_user_k8s_service(request: Request, cluster_id: int, user_id: int):
    """
    Helper function to get KubernetesService for a user's cluster
    
    Args:
        request: FastAPI request
        cluster_id: Cluster ID
        user_id: User ID
        
    Returns:
        KubernetesService instance
        
    Raises:
        HTTPException if cluster not found or access denied
    """
    db = request.state.db if hasattr(request.state, 'db') else SessionLocal()
    
    try:
        k8s_service = cluster_manager.get_kubernetes_service(db, cluster_id, user_id)
        
        if not k8s_service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cluster not found or access denied"
            )

        if not k8s_service.is_connected():
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=(
                    "Cluster is configured but currently unreachable. "
                    "Please verify kubeconfig/API server settings and test connection in Cluster Management."
                ),
            )
        
        return k8s_service
        
    finally:
        if not hasattr(request.state, 'db'):
            db.close()


def resolve_user_k8s_service(request: Request, user_id: int):
    """
    Resolve KubernetesService for the current user.

    Resolution order:
    1. Explicit cluster_id from request state (usually from query param middleware parsing)
    2. First active cluster owned by the user
    3. Global app-level Kubernetes service (demo/fallback for users without clusters)

    Args:
        request: FastAPI request
        user_id: Authenticated user ID

    Returns:
        KubernetesService instance

    Raises:
        HTTPException if a requested cluster is not found/unauthorized
    """
    db = request.state.db if hasattr(request.state, 'db') else SessionLocal()

    try:
        # Prefer explicitly selected cluster from query/path
        cluster_id = getattr(request.state, 'cluster_id', None)
        if cluster_id:
            return get_user_k8s_service(request, cluster_id, user_id)

        # Fall back to first active user cluster if available
        user_clusters = cluster_manager.get_user_clusters(db, user_id)
        if user_clusters:
            default_cluster_id = user_clusters[0].id
            request.state.cluster_id = default_cluster_id
            return get_user_k8s_service(request, default_cluster_id, user_id)

        # No user clusters configured yet -> use global fallback/demo service
        return request.app.state.k8s_service

    finally:
        if not hasattr(request.state, 'db'):
            db.close()


def require_cluster_access(cluster_id: int, user_id: int) -> Callable:
    """
    Decorator to require cluster access
    
    Usage:
        @router.get("/pods")
        @require_cluster_access(cluster_id, user_id)
        async def get_pods(...):
            ...
    """
    def decorator(func: Callable) -> Callable:
        async def wrapper(*args, **kwargs):
            # Validate cluster access
            db = SessionLocal()
            try:
                cluster = cluster_manager.get_cluster_by_id(db, cluster_id, user_id)
                if not cluster:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Access denied to this cluster"
                    )
                return await func(*args, **kwargs)
            finally:
                db.close()
        return wrapper
    return decorator
