"""
Namespace Management Routes
Endpoints for managing Kubernetes namespaces (projects)
"""
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.api.routes.auth import get_current_user
from app.middleware import resolve_user_k8s_service
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


class NamespaceCreate(BaseModel):
    """Request model for creating namespace"""
    name: str
    description: Optional[str] = None


class NamespaceResponse(BaseModel):
    """Response model for namespace"""
    name: str
    status: str
    created: Optional[str] = None
    description: Optional[str] = None
    pod_count: int = 0


# In-memory storage for namespace metadata (in production, use a database)
NAMESPACE_METADATA_DB: Dict[str, Dict[str, Any]] = {
    "default": {"description": "Default namespace"},
    "kube-system": {"description": "Kubernetes system namespace"},
    "monitoring": {"description": "Monitoring and observability tools"},
    "production": {"description": "Production workloads"}
}


@router.get("", response_model=List[NamespaceResponse])
async def get_namespaces(
    request: Request,
    current_user = Depends(get_current_user)
):
    """
    Get all available namespaces (for display in project selector)
    Filters out system namespaces that users shouldn't interact with
    """
    k8s_service = resolve_user_k8s_service(request, current_user.id)
    namespaces = k8s_service.get_namespaces()
    
    # Filter out internal system namespaces
    filtered = []
    for ns in namespaces:
        # Skip kube-node-lease and other internal namespaces
        if ns["name"] not in ["kube-node-lease"]:
            # Get pod count for this namespace
            pods = k8s_service.get_pods(ns["name"])
            pod_count = len(pods)
            
            # Get metadata if available
            metadata = NAMESPACE_METADATA_DB.get(ns["name"], {})
            
            filtered.append(NamespaceResponse(
                name=ns["name"],
                status=ns["status"],
                created=ns.get("created"),
                description=metadata.get("description"),
                pod_count=pod_count
            ))
    
    return filtered


@router.post("/{namespace}/select")
async def select_namespace(
    namespace: str,
    request: Request,
    current_user = Depends(get_current_user)
):
    """
    User selects a namespace/project to work with
    This endpoint validates the namespace exists and allows filtering
    """
    k8s_service = resolve_user_k8s_service(request, current_user.id)
    namespaces = k8s_service.get_namespaces()
    
    # Verify namespace exists
    if not any(n["name"] == namespace for n in namespaces):
        raise HTTPException(
            status_code=404,
            detail=f"Namespace '{namespace}' not found"
        )
    
    # In production, store this in user session (Redis/database)
    # For now, just validate and return success
    logger.info(f"User {current_user.username} selected namespace '{namespace}'")
    
    return {
        "success": True,
        "message": f"Selected namespace '{namespace}'",
        "namespace": namespace,
        "username": current_user.username
    }


@router.get("/{namespace}/summary")
async def get_namespace_summary(
    namespace: str,
    request: Request,
    current_user = Depends(get_current_user)
):
    """
    Get comprehensive summary of namespace resources
    Useful for displaying project overview
    """
    k8s_service = resolve_user_k8s_service(request, current_user.id)
    
    # Verify namespace exists
    namespaces = k8s_service.get_namespaces()
    if not any(n["name"] == namespace for n in namespaces):
        raise HTTPException(
            status_code=404,
            detail=f"Namespace '{namespace}' not found"
        )
    
    # Gather namespace resources
    pods = k8s_service.get_pods(namespace)
    deployments = k8s_service.get_deployments(namespace)
    services = k8s_service.get_services(namespace)
    events = k8s_service.get_events(namespace, limit=50)
    
    # Calculate statistics
    pods_running = sum(1 for p in pods if p.get("status") == "Running")
    pods_pending = sum(1 for p in pods if p.get("status") == "Pending")
    pods_failed = sum(1 for p in pods if p.get("status") in ["Failed", "Error", "CrashLoopBackOff"])
    total_restarts = sum(p.get("restarts", 0) for p in pods)
    
    # Recent events (last 10)
    recent_events = sorted(
        events,
        key=lambda e: e.get("last_seen", ""),
        reverse=True
    )[:10]
    
    # Warning events
    warning_events = [e for e in events if e.get("type") == "Warning"]
    
    return {
        "namespace": namespace,
        "summary": {
            "pod_count": len(pods),
            "pods_running": pods_running,
            "pods_pending": pods_pending,
            "pods_failed": pods_failed,
            "deployment_count": len(deployments),
            "service_count": len(services),
            "total_restarts": total_restarts,
            "warning_count": len(warning_events)
        },
        "health_status": "healthy" if pods_failed == 0 and len(warning_events) == 0 else "warning" if pods_failed == 0 else "critical",
        "recent_events": recent_events,
        "metadata": NAMESPACE_METADATA_DB.get(namespace, {})
    }


@router.get("/{namespace}/health")
async def get_namespace_health(
    namespace: str,
    request: Request,
    current_user = Depends(get_current_user)
):
    """
    Get health status of a specific namespace
    Returns overall health based on pod status and events
    """
    k8s_service = resolve_user_k8s_service(request, current_user.id)
    
    pods = k8s_service.get_pods(namespace)
    events = k8s_service.get_events(namespace, limit=100)
    
    # Health metrics
    total_pods = len(pods)
    running_pods = sum(1 for p in pods if p.get("status") == "Running")
    failed_pods = sum(1 for p in pods if p.get("status") in ["Failed", "Error", "CrashLoopBackOff"])
    high_restart_pods = sum(1 for p in pods if p.get("restarts", 0) > 5)
    
    # Event analysis
    warning_events = [e for e in events if e.get("type") == "Warning"]
    error_events = [e for e in warning_events if "error" in e.get("message", "").lower()]
    
    # Calculate health score (0-100)
    health_score = 100
    if total_pods > 0:
        health_score -= (failed_pods / total_pods) * 30  # Failed pods impact
        health_score -= (high_restart_pods / total_pods) * 20  # High restarts impact
    health_score -= min(len(error_events), 10) * 2  # Error events impact
    health_score -= min(len(warning_events), 20) * 1  # Warning events impact
    health_score = max(0, int(health_score))
    
    # Determine status
    if health_score >= 80:
        status = "healthy"
    elif health_score >= 60:
        status = "warning"
    else:
        status = "critical"
    
    return {
        "namespace": namespace,
        "health_score": health_score,
        "status": status,
        "metrics": {
            "total_pods": total_pods,
            "running_pods": running_pods,
            "failed_pods": failed_pods,
            "high_restart_pods": high_restart_pods,
            "warning_events": len(warning_events),
            "error_events": len(error_events)
        },
        "issues": warning_events[:5] if warning_events else []
    }
