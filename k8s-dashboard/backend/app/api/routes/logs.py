"""
Logs API Routes
Endpoints for log aggregation and search
"""
from fastapi import APIRouter, HTTPException, Request, Query, Depends
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import random
from app.api.routes.auth import get_current_user
from app.middleware import resolve_user_k8s_service

router = APIRouter()


@router.get("/pods/{namespace}/{pod_name}")
async def get_pod_logs(
    namespace: str,
    pod_name: str,
    request: Request,
    container: Optional[str] = None,
    tail_lines: int = Query(default=100, ge=1, le=5000),
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get logs from a specific pod"""
    k8s_service = resolve_user_k8s_service(request, current_user.id)
    
    logs = k8s_service.get_pod_logs(
        name=pod_name,
        namespace=namespace,
        container=container,
        tail_lines=tail_lines
    )
    
    return {
        "pod": pod_name,
        "namespace": namespace,
        "container": container,
        "lines": tail_lines,
        "logs": logs,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/search")
async def search_logs(
    request: Request,
    query: str = Query(..., min_length=1),
    namespace: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = Query(default=100, ge=1, le=1000),
    _user: str = Depends(get_current_user)
) -> Dict[str, Any]:
    """Search logs across pods"""
    # Demo implementation - in production would use ELK/Loki
    demo_logs = _generate_demo_logs(limit, query, severity)
    
    return {
        "query": query,
        "namespace": namespace,
        "severity": severity,
        "count": len(demo_logs),
        "logs": demo_logs
    }


@router.get("/aggregate")
async def get_aggregated_logs(
    request: Request,
    namespace: Optional[str] = None,
    severity: Optional[str] = None,
    since_minutes: int = Query(default=60, ge=1, le=1440),
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get aggregated logs from all pods"""
    k8s_service = resolve_user_k8s_service(request, current_user.id)
    pods = k8s_service.get_pods(namespace)
    
    # Collect logs from each pod (demo mode)
    aggregated_logs = []
    
    for pod in pods[:5]:  # Limit for demo
        pod_logs = k8s_service.get_pod_logs(
            name=pod.get("name"),
            namespace=pod.get("namespace"),
            tail_lines=20
        )
        
        for line in pod_logs.split("\n"):
            if line.strip():
                aggregated_logs.append({
                    "pod": pod.get("name"),
                    "namespace": pod.get("namespace"),
                    "message": line,
                    "timestamp": datetime.utcnow().isoformat()
                })
    
    # Sort by timestamp
    aggregated_logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    
    return {
        "namespace": namespace,
        "since_minutes": since_minutes,
        "count": len(aggregated_logs),
        "logs": aggregated_logs
    }


@router.get("/stats")
async def get_log_stats(
    request: Request,
    namespace: Optional[str] = None,
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get log statistics"""
    k8s_service = resolve_user_k8s_service(request, current_user.id)

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "stats": {
            "total_entries": 15432,
            "last_hour": 1250,
            "by_severity": {
                "INFO": 12500,
                "WARN": 2100,
                "ERROR": 780,
                "DEBUG": 52
            },
            "by_namespace": {
                "default": 4500,
                "kube-system": 8200,
                "production": 2000,
                "monitoring": 732
            },
            "top_pods": [
                {"name": "api-server-xyz", "count": 3200},
                {"name": "nginx-abc", "count": 2100},
                {"name": "prometheus-0", "count": 1800}
            ]
        },
        "demo_mode": not k8s_service.is_connected()
    }


@router.get("/stream/{namespace}/{pod_name}")
async def stream_logs_info(
    namespace: str,
    pod_name: str
) -> Dict[str, Any]:
    """Get info for log streaming (WebSocket endpoint info)"""
    return {
        "pod": pod_name,
        "namespace": namespace,
        "websocket_url": f"/ws/logs/{namespace}/{pod_name}",
        "info": "Connect to WebSocket for real-time log streaming"
    }


def _generate_demo_logs(limit: int, query: str, severity: Optional[str]) -> List[Dict[str, Any]]:
    """Generate demo logs for search"""
    severities = ["INFO", "WARN", "ERROR", "DEBUG"]
    if severity:
        severities = [severity.upper()]
    
    pods = ["api-server", "web-frontend", "nginx", "redis", "prometheus"]
    namespaces = ["default", "production", "monitoring"]
    
    messages = [
        f"Request processed successfully - matching '{query}'",
        f"Database query completed for '{query}'",
        f"Cache hit for key containing '{query}'",
        f"Connection established - related to {query}",
        f"Health check passed - {query} service",
        f"Warning: High latency detected for {query}",
        f"Error: Failed to process {query} request",
        f"Debug: Entering function related to {query}",
    ]
    
    logs = []
    now = datetime.utcnow()
    
    for i in range(min(limit, 50)):
        timestamp = now - timedelta(minutes=random.randint(0, 60))
        logs.append({
            "id": f"log-{i}",
            "timestamp": timestamp.isoformat(),
            "severity": random.choice(severities),
            "pod": f"{random.choice(pods)}-{random.randint(1000, 9999)}",
            "namespace": random.choice(namespaces),
            "message": random.choice(messages),
            "container": "main"
        })
    
    return sorted(logs, key=lambda x: x["timestamp"], reverse=True)
