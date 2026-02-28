"""
Cluster Management API Routes
Multi-cluster configuration with user isolation
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db, Cluster
from app.api.routes.auth import verify_token, get_current_user
from app.services.cluster_manager import cluster_manager
from app.services.audit_service import audit_service
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


# Request/Response Models
class ClusterCreateKubeconfigRequest(BaseModel):
    """Create cluster using kubeconfig"""
    name: str
    kubeconfig_content: str
    description: Optional[str] = None
    allowed_namespaces: Optional[List[str]] = None
    is_namespace_restricted: bool = False


class ClusterCreateTokenRequest(BaseModel):
    """Create cluster using API server and token"""
    name: str
    api_server_url: str
    token: str
    description: Optional[str] = None
    allowed_namespaces: Optional[List[str]] = None
    is_namespace_restricted: bool = False


class ClusterUpdateRequest(BaseModel):
    """Update cluster configuration"""
    name: Optional[str] = None
    description: Optional[str] = None
    allowed_namespaces: Optional[List[str]] = None
    is_namespace_restricted: Optional[bool] = None


class ClusterResponse(BaseModel):
    """Cluster response model"""
    id: int
    name: str
    description: Optional[str] = None
    allowed_namespaces: List[str] = []
    is_namespace_restricted: bool = False
    is_active: bool = True
    last_connected: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ClusterConnectionTest(BaseModel):
    """Connection test result"""
    success: bool
    cluster_info: Optional[dict] = None
    error: Optional[str] = None


@router.post("/", response_model=ClusterResponse, status_code=status.HTTP_201_CREATED)
async def create_cluster_kubeconfig(
    request: ClusterCreateKubeconfigRequest,
    username: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Create a new cluster using kubeconfig file content
    
    User uploads their kubeconfig content which is encrypted and stored securely.
    """
    # Get current user from database
    from app.database import User
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        # Create cluster
        cluster = cluster_manager.create_cluster_from_kubeconfig(
            db=db,
            user_id=user.id,
            name=request.name,
            kubeconfig_content=request.kubeconfig_content,
            description=request.description,
            allowed_namespaces=request.allowed_namespaces,
            is_namespace_restricted=request.is_namespace_restricted
        )
        
        # Audit log
        await audit_service.log_action(
            db=db,
            user_id=user.id,
            cluster_id=cluster.id,
            action="create_cluster",
            resource_type="cluster",
            resource_name=cluster.name,
            status="success"
        )
        
        return cluster
        
    except Exception as e:
        logger.error(f"Failed to create cluster: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create cluster: {str(e)}"
        )


@router.post("/token", response_model=ClusterResponse, status_code=status.HTTP_201_CREATED)
async def create_cluster_token(
    request: ClusterCreateTokenRequest,
    username: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Create a new cluster using API server URL and bearer token
    
    Alternative method for users who prefer token-based authentication.
    """
    # Get current user from database
    from app.database import User
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        # Create cluster
        cluster = cluster_manager.create_cluster_from_token(
            db=db,
            user_id=user.id,
            name=request.name,
            api_server_url=request.api_server_url,
            token=request.token,
            description=request.description,
            allowed_namespaces=request.allowed_namespaces,
            is_namespace_restricted=request.is_namespace_restricted
        )
        
        # Audit log
        await audit_service.log_action(
            db=db,
            user_id=user.id,
            cluster_id=cluster.id,
            action="create_cluster",
            resource_type="cluster",
            resource_name=cluster.name,
            status="success"
        )
        
        return cluster
        
    except Exception as e:
        logger.error(f"Failed to create cluster: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create cluster: {str(e)}"
        )


@router.post("/upload-kubeconfig", response_model=ClusterResponse, status_code=status.HTTP_201_CREATED)
async def upload_kubeconfig_file(
    name: str,
    file: UploadFile = File(...),
    description: Optional[str] = None,
    username: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Upload a kubeconfig file to create a new cluster
    
    Accepts a kubeconfig YAML file upload.
    """
    # Get current user from database
    from app.database import User
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate file type
    if not file.filename.endswith(('.yaml', '.yml', '.conf', '.config')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Expected YAML or config file."
        )
    
    try:
        # Read file content
        content = await file.read()
        kubeconfig_content = content.decode('utf-8')
        
        # Create cluster
        cluster = cluster_manager.create_cluster_from_kubeconfig(
            db=db,
            user_id=user.id,
            name=name,
            kubeconfig_content=kubeconfig_content,
            description=description
        )
        
        # Audit log
        await audit_service.log_action(
            db=db,
            user_id=user.id,
            cluster_id=cluster.id,
            action="upload_kubeconfig",
            resource_type="cluster",
            resource_name=cluster.name,
            status="success"
        )
        
        return cluster
        
    except Exception as e:
        logger.error(f"Failed to upload kubeconfig: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to upload kubeconfig: {str(e)}"
        )


@router.get("/", response_model=List[ClusterResponse])
async def list_clusters(
    username: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Get all clusters for the authenticated user
    
    Returns only clusters owned by the current user.
    """
    # Get current user from database
    from app.database import User
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_id = user.id
    
    clusters = cluster_manager.get_user_clusters(db, user_id)
    return clusters


@router.get("/{cluster_id}", response_model=ClusterResponse)
async def get_cluster(
    cluster_id: int,
    username: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Get a specific cluster by ID
    
    User can only access their own clusters.
    """
    # Get current user from database
    from app.database import User
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_id = user.id
    
    cluster = cluster_manager.get_cluster_by_id(db, cluster_id, user_id)
    
    if not cluster:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cluster not found or access denied"
        )
    
    return cluster


@router.put("/{cluster_id}", response_model=ClusterResponse)
async def update_cluster(
    cluster_id: int,
    request: ClusterUpdateRequest,
    username: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Update cluster configuration
    
    Allows updating name, description, and namespace restrictions.
    Credentials cannot be updated (delete and recreate instead).
    """
    # Get current user from database
    from app.database import User
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_id = user.id
    
    cluster = cluster_manager.update_cluster(
        db=db,
        cluster_id=cluster_id,
        user_id=user_id,
        name=request.name,
        description=request.description,
        allowed_namespaces=request.allowed_namespaces,
        is_namespace_restricted=request.is_namespace_restricted
    )
    
    if not cluster:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cluster not found or access denied"
        )
    
    # Audit log
    await audit_service.log_action(
        db=db,
        user_id=user_id,
        cluster_id=cluster.id,
        action="update_cluster",
        resource_type="cluster",
        resource_name=cluster.name,
        status="success"
    )
    
    return cluster


@router.delete("/{cluster_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cluster(
    cluster_id: int,
    username: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Delete a cluster
    
    Performs soft delete. All encrypted credentials are retained but cluster is marked inactive.
    """
    # Get current user from database
    from app.database import User
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_id = user.id
    
    # Get cluster name for audit log
    cluster = cluster_manager.get_cluster_by_id(db, cluster_id, user_id)
    cluster_name = cluster.name if cluster else "unknown"
    
    success = cluster_manager.delete_cluster(db, cluster_id, user_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cluster not found or access denied"
        )
    
    # Audit log
    await audit_service.log_action(
        db=db,
        user_id=user_id,
        cluster_id=cluster_id,
        action="delete_cluster",
        resource_type="cluster",
        resource_name=cluster_name,
        status="success"
    )
    
    return None


@router.post("/{cluster_id}/test", response_model=ClusterConnectionTest)
async def test_cluster_connection(
    cluster_id: int,
    username: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Test connection to a cluster
    
    Verifies that the cluster credentials are valid and can connect.
    """
    # Get current user from database
    from app.database import User
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_id = user.id
    
    result = cluster_manager.test_cluster_connection(db, cluster_id, user_id)
    
    # Audit log
    await audit_service.log_action(
        db=db,
        user_id=user_id,
        cluster_id=cluster_id,
        action="test_connection",
        resource_type="cluster",
        status="success" if result["success"] else "failed",
        error_message=result.get("error")
    )
    
    return result
