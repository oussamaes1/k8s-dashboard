"""
Cluster Management Service
Handles multi-cluster configuration and dynamic Kubernetes client management
"""
import logging
import tempfile
import os
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session

from app.database import Cluster, User
from app.utils.security import encrypt_kubeconfig, decrypt_kubeconfig, encrypt_token, decrypt_token
from app.services.kubernetes_service import KubernetesService

logger = logging.getLogger(__name__)


class ClusterManager:
    """Manages user clusters and dynamic Kubernetes connections"""
    
    def __init__(self):
        """Initialize cluster manager"""
        # Cache of active Kubernetes service instances per cluster
        # Format: {cluster_id: KubernetesService}
        self._cluster_cache: Dict[int, KubernetesService] = {}
    
    def create_cluster_from_kubeconfig(
        self,
        db: Session,
        user_id: int,
        name: str,
        kubeconfig_content: str,
        description: Optional[str] = None,
        allowed_namespaces: Optional[List[str]] = None,
        is_namespace_restricted: bool = False
    ) -> Cluster:
        """
        Create a new cluster from kubeconfig file
        
        Args:
            db: Database session
            user_id: Owner user ID
            name: Cluster name
            kubeconfig_content: Full kubeconfig YAML content
            description: Optional cluster description
            allowed_namespaces: Optional list of allowed namespaces
            is_namespace_restricted: Whether to restrict namespaces
            
        Returns:
            Created Cluster instance
        """
        # Encrypt kubeconfig
        encrypted = encrypt_kubeconfig(kubeconfig_content)
        
        # Create cluster record
        cluster = Cluster(
            user_id=user_id,
            name=name,
            description=description,
            encrypted_kubeconfig=encrypted,
            allowed_namespaces=allowed_namespaces or [],
            is_namespace_restricted=is_namespace_restricted,
            is_active=True
        )
        
        db.add(cluster)
        db.commit()
        db.refresh(cluster)
        
        logger.info(f"Created cluster '{name}' for user {user_id}")
        return cluster
    
    def create_cluster_from_token(
        self,
        db: Session,
        user_id: int,
        name: str,
        api_server_url: str,
        token: str,
        description: Optional[str] = None,
        allowed_namespaces: Optional[List[str]] = None,
        is_namespace_restricted: bool = False
    ) -> Cluster:
        """
        Create a new cluster from API server URL and token
        
        Args:
            db: Database session
            user_id: Owner user ID
            name: Cluster name
            api_server_url: Kubernetes API server URL
            token: Bearer token for authentication
            description: Optional cluster description
            allowed_namespaces: Optional list of allowed namespaces
            is_namespace_restricted: Whether to restrict namespaces
            
        Returns:
            Created Cluster instance
        """
        # Encrypt token
        encrypted_token = encrypt_token(token)
        
        # Create cluster record
        cluster = Cluster(
            user_id=user_id,
            name=name,
            description=description,
            api_server_url=api_server_url,
            encrypted_token=encrypted_token,
            allowed_namespaces=allowed_namespaces or [],
            is_namespace_restricted=is_namespace_restricted,
            is_active=True
        )
        
        db.add(cluster)
        db.commit()
        db.refresh(cluster)
        
        logger.info(f"Created cluster '{name}' with token auth for user {user_id}")
        return cluster
    
    def get_user_clusters(self, db: Session, user_id: int) -> List[Cluster]:
        """
        Get all clusters for a user
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            List of user's clusters
        """
        return db.query(Cluster).filter(
            Cluster.user_id == user_id,
            Cluster.is_active == True
        ).all()
    
    def get_cluster_by_id(self, db: Session, cluster_id: int, user_id: int) -> Optional[Cluster]:
        """
        Get cluster by ID (with user ownership check)
        
        Args:
            db: Database session
            cluster_id: Cluster ID
            user_id: User ID for ownership verification
            
        Returns:
            Cluster instance or None if not found/unauthorized
        """
        return db.query(Cluster).filter(
            Cluster.id == cluster_id,
            Cluster.user_id == user_id,
            Cluster.is_active == True
        ).first()
    
    def update_cluster(
        self,
        db: Session,
        cluster_id: int,
        user_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        allowed_namespaces: Optional[List[str]] = None,
        is_namespace_restricted: Optional[bool] = None
    ) -> Optional[Cluster]:
        """
        Update cluster configuration
        
        Args:
            db: Database session
            cluster_id: Cluster ID
            user_id: User ID for ownership verification
            name: New cluster name
            description: New description
            allowed_namespaces: New namespace restrictions
            is_namespace_restricted: New restriction flag
            
        Returns:
            Updated Cluster instance or None if not found
        """
        cluster = self.get_cluster_by_id(db, cluster_id, user_id)
        if not cluster:
            return None
        
        if name is not None:
            cluster.name = name
        if description is not None:
            cluster.description = description
        if allowed_namespaces is not None:
            cluster.allowed_namespaces = allowed_namespaces
        if is_namespace_restricted is not None:
            cluster.is_namespace_restricted = is_namespace_restricted
        
        cluster.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(cluster)
        
        # Clear cache for this cluster
        if cluster_id in self._cluster_cache:
            del self._cluster_cache[cluster_id]
        
        logger.info(f"Updated cluster {cluster_id}")
        return cluster
    
    def delete_cluster(self, db: Session, cluster_id: int, user_id: int) -> bool:
        """
        Delete (soft delete) a cluster
        
        Args:
            db: Database session
            cluster_id: Cluster ID
            user_id: User ID for ownership verification
            
        Returns:
            True if deleted, False if not found
        """
        cluster = self.get_cluster_by_id(db, cluster_id, user_id)
        if not cluster:
            return False
        
        # Soft delete
        cluster.is_active = False
        cluster.updated_at = datetime.utcnow()
        
        db.commit()
        
        # Clear cache
        if cluster_id in self._cluster_cache:
            del self._cluster_cache[cluster_id]
        
        logger.info(f"Deleted cluster {cluster_id}")
        return True
    
    def get_kubernetes_service(
        self,
        db: Session,
        cluster_id: int,
        user_id: int
    ) -> Optional[KubernetesService]:
        """
        Get KubernetesService instance for a specific cluster
        
        Args:
            db: Database session
            cluster_id: Cluster ID
            user_id: User ID for ownership verification
            
        Returns:
            KubernetesService instance or None if cluster not found
        """
        # Check cache first
        if cluster_id in self._cluster_cache:
            return self._cluster_cache[cluster_id]
        
        # Get cluster from database
        cluster = self.get_cluster_by_id(db, cluster_id, user_id)
        if not cluster:
            logger.warning(f"Cluster {cluster_id} not found for user {user_id}")
            return None
        
        # Create KubernetesService instance
        try:
            k8s_service = self._create_k8s_service_from_cluster(cluster)
            
            # Update last connected timestamp
            cluster.last_connected = datetime.utcnow()
            db.commit()
            
            # Cache the service
            self._cluster_cache[cluster_id] = k8s_service
            
            return k8s_service
            
        except Exception as e:
            logger.error(f"Failed to create Kubernetes service for cluster {cluster_id}: {e}")
            return None
    
    def _create_k8s_service_from_cluster(self, cluster: Cluster) -> KubernetesService:
        """
        Create KubernetesService instance from cluster configuration
        
        Args:
            cluster: Cluster database model
            
        Returns:
            KubernetesService instance
        """
        if cluster.encrypted_kubeconfig:
            # Use kubeconfig method
            kubeconfig_content = decrypt_kubeconfig(cluster.encrypted_kubeconfig)
            
            # Write kubeconfig to temporary file
            temp_file = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.yaml')
            temp_file.write(kubeconfig_content)
            temp_file.close()
            
            # Create service with temp kubeconfig
            k8s_service = KubernetesService(
                in_cluster=False,
                config_path=temp_file.name,
                allowed_namespaces=cluster.allowed_namespaces if cluster.is_namespace_restricted else None
            )
            
            # Clean up temp file after initialization
            try:
                os.unlink(temp_file.name)
            except OSError:
                pass
            
            return k8s_service
            
        elif cluster.api_server_url and cluster.encrypted_token:
            # Use token method
            token = decrypt_token(cluster.encrypted_token)
            
            # Create service with API server and token
            k8s_service = KubernetesService(
                in_cluster=False,
                api_server=cluster.api_server_url,
                token=token,
                allowed_namespaces=cluster.allowed_namespaces if cluster.is_namespace_restricted else None
            )
            
            return k8s_service
        
        else:
            raise ValueError("Cluster has neither kubeconfig nor API server configuration")
    
    def test_cluster_connection(
        self,
        db: Session,
        cluster_id: int,
        user_id: int
    ) -> Dict[str, Any]:
        """
        Test connection to a cluster
        
        Args:
            db: Database session
            cluster_id: Cluster ID
            user_id: User ID
            
        Returns:
            Connection test result
        """
        k8s_service = self.get_kubernetes_service(db, cluster_id, user_id)
        
        if not k8s_service:
            return {
                "success": False,
                "error": "Failed to initialize cluster connection"
            }
        
        if not k8s_service.is_connected():
            return {
                "success": False,
                "error": "Cannot connect to Kubernetes cluster"
            }
        
        try:
            cluster_info = k8s_service.get_cluster_info()
            return {
                "success": True,
                "cluster_info": cluster_info
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def clear_cache(self, cluster_id: Optional[int] = None):
        """
        Clear cluster cache
        
        Args:
            cluster_id: Specific cluster ID to clear, or None to clear all
        """
        if cluster_id:
            if cluster_id in self._cluster_cache:
                del self._cluster_cache[cluster_id]
                logger.info(f"Cleared cache for cluster {cluster_id}")
        else:
            self._cluster_cache.clear()
            logger.info("Cleared all cluster cache")


# Global cluster manager instance
cluster_manager = ClusterManager()
