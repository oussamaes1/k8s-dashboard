"""  
Cluster API Routes
Endpoints for Kubernetes cluster management with RBAC
"""
from fastapi import APIRouter, HTTPException, Request, Depends, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.api.routes.auth import verify_admin, get_current_user

router = APIRouter()


class DeployPodRequest(BaseModel):
    """Request model for deploying a pod"""
    pod_name: str = Field(..., min_length=1, max_length=253)
    namespace: str = "default"
    image: str = Field(..., min_length=1)
    replicas: int = Field(1, ge=0, le=100)
    cpu_request: str = "100m"
    memory_request: str = "128Mi"
    cpu_limit: str = "500m"
    memory_limit: str = "512Mi"
    port: Optional[int] = None
    env_variables: Optional[Dict[str, str]] = None


class DeploymentResponse(BaseModel):
    """Response model for deployment"""
    success: bool
    message: str
    pod_name: Optional[str] = None
    namespace: Optional[str] = None


@router.get("/info")
async def get_cluster_info(request: Request, _user: str = Depends(get_current_user)) -> Dict[str, Any]:
    """Get cluster information"""
    k8s_service = request.app.state.k8s_service
    return k8s_service.get_cluster_info()


@router.get("/health")
async def get_cluster_health(request: Request, _user: str = Depends(get_current_user)) -> Dict[str, Any]:
    """Get comprehensive cluster health analysis with anomaly detection"""
    k8s_service = request.app.state.k8s_service
    anomaly_detector = request.app.state.anomaly_detector
    
    nodes = k8s_service.get_nodes()
    pods = k8s_service.get_pods()
    events = k8s_service.get_events()
    
    return anomaly_detector.analyze_cluster_health(nodes, pods, events)


@router.get("/nodes")
async def get_nodes(request: Request, _user: str = Depends(get_current_user)) -> List[Dict[str, Any]]:
    """Get all nodes in the cluster"""
    k8s_service = request.app.state.k8s_service
    return k8s_service.get_nodes()


@router.get("/nodes/{node_name}")
async def get_node(node_name: str, request: Request, _user: str = Depends(get_current_user)) -> Dict[str, Any]:
    """Get specific node details"""
    k8s_service = request.app.state.k8s_service
    nodes = k8s_service.get_nodes()
    
    for node in nodes:
        if node.get("name") == node_name:
            return node
    
    raise HTTPException(status_code=404, detail=f"Node {node_name} not found")


@router.get("/namespaces")
async def get_namespaces(request: Request, _user: str = Depends(get_current_user)) -> List[Dict[str, Any]]:
    """Get all namespaces"""
    k8s_service = request.app.state.k8s_service
    return k8s_service.get_namespaces()


@router.get("/pods")
async def get_pods(
    request: Request,
    namespace: Optional[str] = None,
    _user: str = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """Get all pods, optionally filtered by namespace"""
    k8s_service = request.app.state.k8s_service
    return k8s_service.get_pods(namespace)


@router.get("/pods/{namespace}/{pod_name}")
async def get_pod(namespace: str, pod_name: str, request: Request, _user: str = Depends(get_current_user)) -> Dict[str, Any]:
    """Get specific pod details"""
    k8s_service = request.app.state.k8s_service
    pods = k8s_service.get_pods(namespace)
    
    for pod in pods:
        if pod.get("name") == pod_name:
            return pod
    
    raise HTTPException(status_code=404, detail=f"Pod {pod_name} not found in namespace {namespace}")


@router.get("/deployments")
async def get_deployments(
    request: Request,
    namespace: Optional[str] = None,
    _user: str = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """Get all deployments"""
    k8s_service = request.app.state.k8s_service
    return k8s_service.get_deployments(namespace)


@router.get("/services")
async def get_services(
    request: Request,
    namespace: Optional[str] = None,
    _user: str = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """Get all services"""
    k8s_service = request.app.state.k8s_service
    return k8s_service.get_services(namespace)


@router.post("/pods/{namespace}/{pod_name}/restart")
async def restart_pod(namespace: str, pod_name: str, request: Request, admin: str = Depends(verify_admin)) -> Dict[str, Any]:
    """Restart a pod (Admin only) - deletes the pod and lets controller recreate it"""
    k8s_service = request.app.state.k8s_service
    
    try:
        result = k8s_service.delete_pod(namespace, pod_name)
        return {
            "success": True,
            "message": f"Pod '{pod_name}' restarted successfully (will be recreated by controller)",
            "pod_name": pod_name,
            "namespace": namespace
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to restart pod: {str(e)}"
        )


@router.post("/deployments/{namespace}/{deployment_name}/scale")
async def scale_deployment(namespace: str, deployment_name: str, replicas: int = Query(..., ge=0, le=100), request: Request = None, admin: str = Depends(verify_admin)) -> Dict[str, Any]:
    """Scale a deployment (Admin only)"""
    k8s_service = request.app.state.k8s_service
    
    try:
        result = k8s_service.scale_deployment(namespace, deployment_name, replicas)
        return {
            "success": True,
            "message": f"Deployment '{deployment_name}' scaled to {replicas} replicas",
            "deployment_name": deployment_name,
            "namespace": namespace,
            "replicas": replicas
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to scale deployment: {str(e)}"
        )


@router.get("/events")
async def get_events(
    request: Request,
    namespace: Optional[str] = None,
    limit: int = 100,
    _user: str = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """Get cluster events"""
    k8s_service = request.app.state.k8s_service
    return k8s_service.get_events(namespace, limit)


@router.get("/summary")
async def get_cluster_summary(request: Request, _user: str = Depends(get_current_user)) -> Dict[str, Any]:
    """Get cluster summary with counts"""
    k8s_service = request.app.state.k8s_service
    
    nodes = k8s_service.get_nodes()
    pods = k8s_service.get_pods()
    deployments = k8s_service.get_deployments()
    services = k8s_service.get_services()
    namespaces = k8s_service.get_namespaces()
    
    return {
        "nodes": {
            "total": len(nodes),
            "ready": sum(1 for n in nodes if n.get("status") == "Ready"),
            "not_ready": sum(1 for n in nodes if n.get("status") != "Ready")
        },
        "pods": {
            "total": len(pods),
            "running": sum(1 for p in pods if p.get("status") == "Running"),
            "pending": sum(1 for p in pods if p.get("status") == "Pending"),
            "failed": sum(1 for p in pods if p.get("status") in ["Failed", "Error"]),
            "total_restarts": sum(p.get("restarts", 0) for p in pods)
        },
        "deployments": {
            "total": len(deployments),
            "healthy": sum(1 for d in deployments if d.get("ready_replicas", 0) == d.get("replicas", 0))
        },
        "services": {
            "total": len(services)
        },
        "namespaces": {
            "total": len(namespaces)
        }
    }
