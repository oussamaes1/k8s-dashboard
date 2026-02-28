"""
Alerts API Routes
Endpoints for alert management and notifications
"""
from fastapi import APIRouter, HTTPException, Request, Depends
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
from enum import Enum
import uuid
from app.api.routes.auth import get_current_user

router = APIRouter()


class AlertSeverity(str, Enum):
    """Alert severity levels"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class AlertStatus(str, Enum):
    """Alert status"""
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"


class AlertRule(BaseModel):
    """Alert rule configuration"""
    name: str
    description: str = ""
    metric: str
    operator: str = Field(..., pattern="^(gt|lt|eq|gte|lte)$")
    threshold: float
    severity: AlertSeverity = AlertSeverity.WARNING
    enabled: bool = True


class AlertAcknowledge(BaseModel):
    """Alert acknowledgement"""
    acknowledged_by: str
    comment: Optional[str] = None


# In-memory storage (would use database in production)
alert_rules: Dict[str, Dict] = {
    "rule-1": {
        "id": "rule-1",
        "name": "High CPU Usage",
        "description": "Alert when CPU usage exceeds 80%",
        "metric": "cpu_percent",
        "operator": "gt",
        "threshold": 80.0,
        "severity": "warning",
        "enabled": True,
        "created": "2024-01-01T00:00:00Z"
    },
    "rule-2": {
        "id": "rule-2",
        "name": "Critical Memory Usage",
        "description": "Alert when memory usage exceeds 95%",
        "metric": "memory_percent",
        "operator": "gt",
        "threshold": 95.0,
        "severity": "critical",
        "enabled": True,
        "created": "2024-01-01T00:00:00Z"
    },
    "rule-3": {
        "id": "rule-3",
        "name": "Pod Restart Alert",
        "description": "Alert when pod restarts exceed threshold",
        "metric": "pod_restarts",
        "operator": "gt",
        "threshold": 5.0,
        "severity": "error",
        "enabled": True,
        "created": "2024-01-01T00:00:00Z"
    }
}

active_alerts: Dict[str, Dict] = {
    "alert-1": {
        "id": "alert-1",
        "rule_id": "rule-2",
        "rule_name": "Critical Memory Usage",
        "severity": "critical",
        "status": "active",
        "message": "Memory usage at 97% on node-2",
        "resource": "node-2",
        "namespace": None,
        "value": 97.0,
        "threshold": 95.0,
        "triggered_at": (datetime.utcnow() - timedelta(minutes=15)).isoformat(),
        "acknowledged_at": None,
        "acknowledged_by": None,
        "resolved_at": None
    },
    "alert-2": {
        "id": "alert-2",
        "rule_id": "rule-3",
        "rule_name": "Pod Restart Alert",
        "severity": "error",
        "status": "acknowledged",
        "message": "Pod api-server has 8 restarts",
        "resource": "api-server-6f8d9c7b8-abc12",
        "namespace": "production",
        "value": 8.0,
        "threshold": 5.0,
        "triggered_at": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
        "acknowledged_at": (datetime.utcnow() - timedelta(hours=1)).isoformat(),
        "acknowledged_by": "admin",
        "resolved_at": None
    }
}


@router.get("/")
async def get_alerts(
    status: Optional[AlertStatus] = None,
    severity: Optional[AlertSeverity] = None,
    _user: str = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """Get all alerts, optionally filtered"""
    alerts = list(active_alerts.values())
    
    if status:
        alerts = [a for a in alerts if a.get("status") == status.value]
    
    if severity:
        alerts = [a for a in alerts if a.get("severity") == severity.value]
    
    return sorted(alerts, key=lambda x: x.get("triggered_at", ""), reverse=True)


@router.get("/active")
async def get_active_alerts(_user: str = Depends(get_current_user)) -> Dict[str, Any]:
    """Get active (non-resolved) alerts with summary"""
    active = [a for a in active_alerts.values() if a.get("status") != "resolved"]
    
    return {
        "count": len(active),
        "by_severity": {
            "critical": sum(1 for a in active if a.get("severity") == "critical"),
            "error": sum(1 for a in active if a.get("severity") == "error"),
            "warning": sum(1 for a in active if a.get("severity") == "warning"),
            "info": sum(1 for a in active if a.get("severity") == "info")
        },
        "alerts": active
    }


@router.get("/stats")
async def get_alert_stats(_user: str = Depends(get_current_user)) -> Dict[str, Any]:
    """Get alert statistics"""
    all_alerts = list(active_alerts.values())
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "total_rules": len(alert_rules),
        "enabled_rules": sum(1 for r in alert_rules.values() if r.get("enabled")),
        "total_alerts": len(all_alerts),
        "active_alerts": sum(1 for a in all_alerts if a.get("status") == "active"),
        "acknowledged_alerts": sum(1 for a in all_alerts if a.get("status") == "acknowledged"),
        "resolved_alerts": sum(1 for a in all_alerts if a.get("status") == "resolved"),
        "alerts_last_24h": len(all_alerts),  # Demo
        "by_severity": {
            "critical": sum(1 for a in all_alerts if a.get("severity") == "critical"),
            "error": sum(1 for a in all_alerts if a.get("severity") == "error"),
            "warning": sum(1 for a in all_alerts if a.get("severity") == "warning"),
            "info": sum(1 for a in all_alerts if a.get("severity") == "info")
        }
    }


@router.get("/{alert_id}")
async def get_alert(alert_id: str, _user: str = Depends(get_current_user)) -> Dict[str, Any]:
    """Get specific alert details"""
    if alert_id not in active_alerts:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
    return active_alerts[alert_id]


@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, ack: AlertAcknowledge, _user: str = Depends(get_current_user)) -> Dict[str, Any]:
    """Acknowledge an alert"""
    if alert_id not in active_alerts:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
    
    alert = active_alerts[alert_id]
    alert["status"] = "acknowledged"
    alert["acknowledged_at"] = datetime.utcnow().isoformat()
    alert["acknowledged_by"] = ack.acknowledged_by
    if ack.comment:
        alert["acknowledgement_comment"] = ack.comment
    
    return alert


@router.post("/{alert_id}/resolve")
async def resolve_alert(alert_id: str, _user: str = Depends(get_current_user)) -> Dict[str, Any]:
    """Resolve an alert"""
    if alert_id not in active_alerts:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
    
    alert = active_alerts[alert_id]
    alert["status"] = "resolved"
    alert["resolved_at"] = datetime.utcnow().isoformat()
    
    return alert


# Alert Rules endpoints
@router.get("/rules/")
async def get_alert_rules(_user: str = Depends(get_current_user)) -> List[Dict[str, Any]]:
    """Get all alert rules"""
    return list(alert_rules.values())


@router.post("/rules/")
async def create_alert_rule(rule: AlertRule, _user: str = Depends(get_current_user)) -> Dict[str, Any]:
    """Create a new alert rule"""
    rule_id = f"rule-{uuid.uuid4().hex[:8]}"
    
    new_rule = {
        "id": rule_id,
        **rule.model_dump(),
        "created": datetime.utcnow().isoformat()
    }
    
    alert_rules[rule_id] = new_rule
    return new_rule


@router.get("/rules/{rule_id}")
async def get_alert_rule(rule_id: str, _user: str = Depends(get_current_user)) -> Dict[str, Any]:
    """Get specific alert rule"""
    if rule_id not in alert_rules:
        raise HTTPException(status_code=404, detail=f"Rule {rule_id} not found")
    return alert_rules[rule_id]


@router.put("/rules/{rule_id}")
async def update_alert_rule(rule_id: str, rule: AlertRule, _user: str = Depends(get_current_user)) -> Dict[str, Any]:
    """Update an alert rule"""
    if rule_id not in alert_rules:
        raise HTTPException(status_code=404, detail=f"Rule {rule_id} not found")
    
    existing = alert_rules[rule_id]
    updated_rule = {
        **existing,
        **rule.model_dump(),
        "updated": datetime.utcnow().isoformat()
    }
    
    alert_rules[rule_id] = updated_rule
    return updated_rule


@router.delete("/rules/{rule_id}")
async def delete_alert_rule(rule_id: str, _user: str = Depends(get_current_user)) -> Dict[str, str]:
    """Delete an alert rule"""
    if rule_id not in alert_rules:
        raise HTTPException(status_code=404, detail=f"Rule {rule_id} not found")
    
    del alert_rules[rule_id]
    return {"message": f"Rule {rule_id} deleted successfully"}


@router.post("/rules/{rule_id}/toggle")
async def toggle_alert_rule(rule_id: str, _user: str = Depends(get_current_user)) -> Dict[str, Any]:
    """Enable or disable an alert rule"""
    if rule_id not in alert_rules:
        raise HTTPException(status_code=404, detail=f"Rule {rule_id} not found")
    
    rule = alert_rules[rule_id]
    rule["enabled"] = not rule.get("enabled", True)
    
    return rule
