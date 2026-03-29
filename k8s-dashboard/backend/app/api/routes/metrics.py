"""
Metrics API Routes
Endpoints for cluster metrics and anomaly detection
"""
from fastapi import APIRouter, HTTPException, Request, Depends
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.api.routes.auth import get_current_user
from app.middleware import resolve_user_k8s_service

router = APIRouter()


def _parse_memory(value: str) -> int:
    """Parse Kubernetes memory string (e.g., '24191164Ki', '16Gi', '512Mi') to MiB."""
    if isinstance(value, (int, float)):
        return int(value)
    value = str(value).strip()
    try:
        if value.endswith("Ki"):
            return int(value[:-2]) // 1024  # KiB to MiB
        elif value.endswith("Mi"):
            return int(value[:-2])
        elif value.endswith("Gi"):
            return int(value[:-2]) * 1024
        elif value.endswith("Ti"):
            return int(value[:-2]) * 1024 * 1024
        else:
            return int(value)
    except (ValueError, TypeError):
        return 0


class MetricsInput(BaseModel):
    """Input model for metrics"""
    cpu_percent: float = 0
    memory_percent: float = 0
    disk_percent: float = 0
    network_in_bytes: float = 0
    network_out_bytes: float = 0
    pod_count: float = 0
    pod_restarts: float = 0


@router.get("/current")
async def get_current_metrics(request: Request, current_user = Depends(get_current_user)) -> Dict[str, Any]:
    """Get current cluster metrics"""
    k8s_service = resolve_user_k8s_service(request, current_user.id)
    
    pods = k8s_service.get_pods()
    nodes = k8s_service.get_nodes()
    
    # Calculate basic metrics
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "cluster": {
            "nodes_total": len(nodes),
            "nodes_ready": sum(1 for n in nodes if n.get("status") == "Ready"),
            "pods_total": len(pods),
            "pods_running": sum(1 for p in pods if p.get("status") == "Running"),
            "pods_pending": sum(1 for p in pods if p.get("status") == "Pending"),
            "total_restarts": sum(p.get("restarts", 0) for p in pods)
        },
        "resources": {
            "total_cpu_capacity": sum(int(n.get("cpu", 0)) for n in nodes),
            "total_memory_capacity": sum(
                _parse_memory(n.get("memory", "0Gi"))
                for n in nodes
            ),
            "total_pods_capacity": sum(int(n.get("pods", 0)) for n in nodes)
        },
        "demo_mode": not k8s_service.is_connected()
    }


@router.get("/nodes/{node_name}")
async def get_node_metrics(node_name: str, request: Request, current_user = Depends(get_current_user)) -> Dict[str, Any]:
    """Get metrics for a specific node"""
    k8s_service = resolve_user_k8s_service(request, current_user.id)
    nodes = k8s_service.get_nodes()
    
    for node in nodes:
        if node.get("name") == node_name:
            # In real scenario, would fetch from metrics-server
            return {
                "node": node_name,
                "timestamp": datetime.utcnow().isoformat(),
                "cpu": {
                    "capacity": node.get("cpu", "N/A"),
                    "usage_percent": 45.5  # Demo value
                },
                "memory": {
                    "capacity": node.get("memory", "N/A"),
                    "usage_percent": 62.3  # Demo value
                },
                "pods": {
                    "capacity": node.get("pods", "N/A"),
                    "running": 25  # Demo value
                }
            }
    
    raise HTTPException(status_code=404, detail=f"Node {node_name} not found")


@router.post("/detect")
async def detect_anomaly(metrics: MetricsInput, request: Request, _user: str = Depends(get_current_user)) -> Dict[str, Any]:
    """Detect anomalies in provided metrics"""
    anomaly_detector = request.app.state.anomaly_detector
    
    metrics_dict = metrics.model_dump()
    is_anomaly, score, details = anomaly_detector.detect(metrics_dict)
    
    return {
        "is_anomaly": is_anomaly,
        "anomaly_score": score,
        "details": details,
        "input_metrics": metrics_dict
    }


@router.get("/anomalies")
async def get_anomaly_history(
    request: Request,
    limit: int = 20,
    _user: str = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """Get history of detected anomalies"""
    anomaly_detector = request.app.state.anomaly_detector
    return anomaly_detector.get_anomaly_history(limit)


@router.get("/summary")
async def get_metrics_summary(request: Request, _user: str = Depends(get_current_user)) -> Dict[str, Any]:
    """Get summary statistics of collected metrics"""
    anomaly_detector = request.app.state.anomaly_detector
    return anomaly_detector.get_metrics_summary()


@router.get("/history")
async def get_metrics_history(
    request: Request,
    metric: Optional[str] = None,
    limit: int = 100,
    _user: str = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get historical metrics data for charting"""
    # Demo data for visualization
    import random
    from datetime import timedelta
    
    now = datetime.utcnow()
    data_points = []
    
    for i in range(min(limit, 60)):
        timestamp = now - timedelta(minutes=i)
        point = {
            "timestamp": timestamp.isoformat(),
            "cpu_percent": 40 + random.uniform(-15, 25),
            "memory_percent": 55 + random.uniform(-10, 20),
            "disk_percent": 35 + random.uniform(-5, 10),
            "pod_count": 6 + random.randint(-1, 2),
            "network_in": random.uniform(100, 500),
            "network_out": random.uniform(50, 300)
        }
        
        if metric:
            point = {
                "timestamp": point["timestamp"],
                metric: point.get(metric, 0)
            }
        
        data_points.append(point)
    
    return {
        "data": list(reversed(data_points)),
        "metric": metric or "all",
        "count": len(data_points)
    }
