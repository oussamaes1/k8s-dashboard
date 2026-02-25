"""
Audit Service
Logging user actions for security and compliance
"""
import logging
from typing import Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import Request

from app.database import AuditLog

logger = logging.getLogger(__name__)


class AuditService:
    """Service for logging user actions"""
    
    async def log_action(
        self,
        db: Session,
        user_id: int,
        action: str,
        status: str = "success",
        cluster_id: Optional[int] = None,
        resource_type: Optional[str] = None,
        resource_name: Optional[str] = None,
        namespace: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        """
        Log a user action
        
        Args:
            db: Database session
            user_id: User ID performing the action
            action: Action performed (e.g., "delete_pod", "scale_deployment")
            status: Action status (success, failed, error)
            cluster_id: Cluster ID where action was performed
            resource_type: Type of resource (pod, deployment, service, etc.)
            resource_name: Name of the resource
            namespace: Kubernetes namespace
            details: Additional metadata
            error_message: Error message if action failed
            ip_address: User's IP address
            user_agent: User's browser/client agent
        """
        try:
            audit_log = AuditLog(
                user_id=user_id,
                cluster_id=cluster_id,
                action=action,
                resource_type=resource_type,
                resource_name=resource_name,
                namespace=namespace,
                details=details,
                status=status,
                error_message=error_message,
                ip_address=ip_address,
                user_agent=user_agent,
                timestamp=datetime.utcnow()
            )
            
            db.add(audit_log)
            db.commit()
            
            logger.info(
                f"Audit: user={user_id} action={action} resource={resource_type}/{resource_name} "
                f"status={status} cluster={cluster_id}"
            )
            
        except Exception as e:
            logger.error(f"Failed to log audit action: {e}")
            # Don't fail the original action if audit log fails
            db.rollback()
    
    async def log_action_from_request(
        self,
        db: Session,
        request: Request,
        user_id: int,
        action: str,
        status: str = "success",
        **kwargs
    ):
        """
        Log action with automatic request metadata extraction
        
        Args:
            db: Database session
            request: FastAPI request object
            user_id: User ID
            action: Action performed
            status: Action status
            **kwargs: Additional audit log parameters
        """
        # Extract metadata from request
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        
        await self.log_action(
            db=db,
            user_id=user_id,
            action=action,
            status=status,
            ip_address=ip_address,
            user_agent=user_agent,
            **kwargs
        )
    
    def get_user_audit_logs(
        self,
        db: Session,
        user_id: int,
        limit: int = 100,
        offset: int = 0
    ):
        """
        Get audit logs for a specific user
        
        Args:
            db: Database session
            user_id: User ID
            limit: Maximum number of logs to return
            offset: Offset for pagination
            
        Returns:
            List of audit logs
        """
        return db.query(AuditLog).filter(
            AuditLog.user_id == user_id
        ).order_by(
            AuditLog.timestamp.desc()
        ).limit(limit).offset(offset).all()
    
    def get_cluster_audit_logs(
        self,
        db: Session,
        cluster_id: int,
        user_id: int,
        limit: int = 100,
        offset: int = 0
    ):
        """
        Get audit logs for a specific cluster (with user verification)
        
        Args:
            db: Database session
            cluster_id: Cluster ID
            user_id: User ID (for ownership verification)
            limit: Maximum number of logs to return
            offset: Offset for pagination
            
        Returns:
            List of audit logs
        """
        return db.query(AuditLog).filter(
            AuditLog.cluster_id == cluster_id,
            AuditLog.user_id == user_id
        ).order_by(
            AuditLog.timestamp.desc()
        ).limit(limit).offset(offset).all()
    
    def get_recent_activity(
        self,
        db: Session,
        user_id: int,
        limit: int = 10
    ):
        """
        Get recent activity for a user (formatted for UI)
        
        Args:
            db: Database session
            user_id: User ID
            limit: Maximum number of activities
            
        Returns:
            List of formatted activity entries
        """
        logs = self.get_user_audit_logs(db, user_id, limit=limit)
        
        activities = []
        for log in logs:
            # Format activity message
            message = self._format_activity_message(log)
            
            # Calculate time ago
            time_ago = self._calculate_time_ago(log.timestamp)
            
            activities.append({
                "action": message,
                "timestamp": time_ago,
                "status": log.status,
                "details": log.details
            })
        
        return activities
    
    def _format_activity_message(self, log: AuditLog) -> str:
        """Format audit log into human-readable message"""
        if log.resource_type and log.resource_name:
            return f"{log.action.replace('_', ' ').title()}: {log.resource_type}/{log.resource_name}"
        else:
            return log.action.replace('_', ' ').title()
    
    def _calculate_time_ago(self, timestamp: datetime) -> str:
        """Calculate time ago from timestamp"""
        now = datetime.utcnow()
        diff = now - timestamp
        
        seconds = diff.total_seconds()
        
        if seconds < 60:
            return "just now"
        elif seconds < 3600:
            minutes = int(seconds / 60)
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        elif seconds < 86400:
            hours = int(seconds / 3600)
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        else:
            days = int(seconds / 86400)
            return f"{days} day{'s' if days > 1 else ''} ago"


# Global audit service instance
audit_service = AuditService()
