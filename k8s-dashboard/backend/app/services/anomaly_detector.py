"""
Anomaly Detector Service
Uses Isolation Forest algorithm for detecting anomalies in Kubernetes cluster metrics
"""
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
import numpy as np
from collections import deque

logger = logging.getLogger(__name__)


class AnomalyDetector:
    """
    Isolation Forest based anomaly detection for Kubernetes metrics
    
    The Isolation Forest algorithm isolates observations by randomly selecting
    a feature and then randomly selecting a split value between the maximum
    and minimum values of that feature. Anomalies are points that have shorter
    average path lengths in the trees.
    """
    
    def __init__(self, contamination: float = 0.1, n_estimators: int = 100,
                 max_samples: str = "auto", random_state: int = 42):
        """
        Initialize the Anomaly Detector
        
        Args:
            contamination: Expected proportion of outliers in the data (0.0 to 0.5)
            n_estimators: Number of base estimators (trees) in the ensemble
            max_samples: Number of samples to draw for training each tree
            random_state: Random seed for reproducibility
        """
        self.contamination = contamination
        self.n_estimators = n_estimators
        self.max_samples = max_samples
        self.random_state = random_state
        
        self._model = None
        self._scaler = None
        self._is_trained = False
        self._feature_names: List[str] = []
        
        # Historical data storage
        self._metrics_history: deque = deque(maxlen=1000)
        self._anomaly_history: deque = deque(maxlen=100)
        
        # Thresholds
        self._anomaly_threshold = -0.5  # Default threshold
        
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the Isolation Forest model"""
        try:
            from sklearn.ensemble import IsolationForest
            from sklearn.preprocessing import StandardScaler
            
            self._model = IsolationForest(
                contamination=self.contamination,
                n_estimators=self.n_estimators,
                max_samples=self.max_samples,
                random_state=self.random_state,
                n_jobs=-1  # Use all CPU cores
            )
            self._scaler = StandardScaler()
            logger.info("Isolation Forest model initialized successfully")
            
        except ImportError as e:
            logger.error(f"Failed to import sklearn: {e}")
            logger.info("Running in demo mode without ML capabilities")
    
    def is_ready(self) -> bool:
        """Check if the detector is ready"""
        return self._model is not None
    
    def train(self, metrics_data: List[Dict[str, float]]) -> bool:
        """
        Train the Isolation Forest model with historical metrics
        
        Args:
            metrics_data: List of metrics dictionaries
            
        Returns:
            True if training successful, False otherwise
        """
        if not self._model:
            return False
        
        try:
            if len(metrics_data) < 10:
                logger.warning("Not enough data for training (minimum 10 samples)")
                return False
            
            # Convert to numpy array
            self._feature_names = list(metrics_data[0].keys())
            X = np.array([[m.get(f, 0) for f in self._feature_names] for m in metrics_data])
            
            # Scale the data
            X_scaled = self._scaler.fit_transform(X)
            
            # Train the model
            self._model.fit(X_scaled)
            self._is_trained = True
            
            logger.info(f"Model trained with {len(metrics_data)} samples")
            return True
            
        except Exception as e:
            logger.error(f"Training failed: {e}")
            return False
    
    def detect(self, metrics: Dict[str, float]) -> Tuple[bool, float, Dict[str, Any]]:
        """
        Detect if current metrics indicate an anomaly
        
        Args:
            metrics: Dictionary of current metric values
            
        Returns:
            Tuple of (is_anomaly, anomaly_score, details)
        """
        if self._model is None:
            return self._demo_detect(metrics)
        
        # Store metrics in history
        metrics_with_timestamp = {**metrics, "timestamp": datetime.utcnow().isoformat()}
        self._metrics_history.append(metrics_with_timestamp)
        
        if not self._is_trained:
            # Auto-train if we have enough data
            if len(self._metrics_history) >= 50:
                self.train([{k: v for k, v in m.items() if k != "timestamp"} 
                           for m in list(self._metrics_history)])
            return self._demo_detect(metrics)
        
        try:
            # Prepare input
            X = np.array([[metrics.get(f, 0) for f in self._feature_names]])
            X_scaled = self._scaler.transform(X)
            
            # Get anomaly score (negative = more anomalous)
            score = self._model.decision_function(X_scaled)[0]
            prediction = self._model.predict(X_scaled)[0]
            
            is_anomaly = prediction == -1
            
            # Calculate normalized score (0 to 1, higher = more anomalous)
            normalized_score = max(0, min(1, (self._anomaly_threshold - score) / abs(self._anomaly_threshold)))
            
            details = {
                "raw_score": float(score),
                "normalized_score": float(normalized_score),
                "threshold": self._anomaly_threshold,
                "features_analyzed": self._feature_names,
                "is_anomaly": is_anomaly,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            if is_anomaly:
                # Identify contributing features
                details["contributing_factors"] = self._identify_anomaly_factors(metrics)
                self._anomaly_history.append(details)
            
            return is_anomaly, normalized_score, details
            
        except Exception as e:
            logger.error(f"Detection failed: {e}")
            return False, 0.0, {"error": str(e)}
    
    def _identify_anomaly_factors(self, metrics: Dict[str, float]) -> List[Dict[str, Any]]:
        """Identify which metrics contributed most to the anomaly"""
        if len(self._metrics_history) < 10:
            return []
        
        factors = []
        
        # Calculate z-scores for each metric
        history = list(self._metrics_history)
        for feature in self._feature_names:
            values = [h.get(feature, 0) for h in history if feature in h and feature != "timestamp"]
            if not values:
                continue
                
            mean = np.mean(values)
            std = np.std(values)
            
            if std > 0:
                current = metrics.get(feature, 0)
                z_score = (current - mean) / std
                
                if abs(z_score) > 2:  # More than 2 standard deviations
                    factors.append({
                        "feature": feature,
                        "current_value": current,
                        "mean": float(mean),
                        "std": float(std),
                        "z_score": float(z_score),
                        "severity": "high" if abs(z_score) > 3 else "medium"
                    })
        
        return sorted(factors, key=lambda x: abs(x["z_score"]), reverse=True)
    
    def _demo_detect(self, metrics: Dict[str, float]) -> Tuple[bool, float, Dict[str, Any]]:
        """Demo detection when sklearn is not available"""
        # Simple rule-based detection for demo
        is_anomaly = False
        score = 0.0
        factors = []
        
        # Check CPU
        cpu = metrics.get("cpu_percent", 0)
        if cpu > 90:
            is_anomaly = True
            score = max(score, 0.9)
            factors.append({"feature": "cpu_percent", "value": cpu, "threshold": 90})
        elif cpu > 80:
            score = max(score, 0.5)
            factors.append({"feature": "cpu_percent", "value": cpu, "threshold": 80})
        
        # Check Memory
        memory = metrics.get("memory_percent", 0)
        if memory > 95:
            is_anomaly = True
            score = max(score, 0.95)
            factors.append({"feature": "memory_percent", "value": memory, "threshold": 95})
        elif memory > 85:
            score = max(score, 0.6)
            factors.append({"feature": "memory_percent", "value": memory, "threshold": 85})
        
        # Check Pod Restarts
        restarts = metrics.get("pod_restarts", 0)
        if restarts > 5:
            is_anomaly = True
            score = max(score, 0.8)
            factors.append({"feature": "pod_restarts", "value": restarts, "threshold": 5})
        
        return is_anomaly, score, {
            "demo_mode": True,
            "is_anomaly": is_anomaly,
            "score": score,
            "contributing_factors": factors,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def get_anomaly_history(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get recent anomaly history"""
        return list(self._anomaly_history)[-limit:]
    
    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get summary statistics of collected metrics"""
        if len(self._metrics_history) < 2:
            return {"status": "insufficient_data", "samples": len(self._metrics_history)}
        
        history = list(self._metrics_history)
        summary = {
            "total_samples": len(history),
            "model_trained": self._is_trained,
            "anomalies_detected": len(self._anomaly_history),
            "features": {}
        }
        
        # Calculate stats for each feature
        for feature in self._feature_names:
            values = [h.get(feature, 0) for h in history if feature in h]
            if values:
                summary["features"][feature] = {
                    "min": float(np.min(values)),
                    "max": float(np.max(values)),
                    "mean": float(np.mean(values)),
                    "std": float(np.std(values))
                }
        
        return summary
    
    def analyze_cluster_health(self, nodes: List[Dict], pods: List[Dict], 
                               events: List[Dict]) -> Dict[str, Any]:
        """
        Comprehensive cluster health analysis
        
        Args:
            nodes: List of node information
            pods: List of pod information  
            events: List of cluster events
            
        Returns:
            Health analysis with anomaly detection
        """
        # Calculate metrics from cluster data
        metrics = self._extract_cluster_metrics(nodes, pods, events)
        
        # Run anomaly detection
        is_anomaly, score, details = self.detect(metrics)
        
        # Calculate health score (0-100)
        health_score = max(0, min(100, int((1 - score) * 100)))
        
        # Determine health status
        if health_score >= 90:
            status = "healthy"
        elif health_score >= 70:
            status = "warning"
        elif health_score >= 50:
            status = "degraded"
        else:
            status = "critical"
        
        # Identify issues
        issues = self._identify_issues(nodes, pods, events)
        
        return {
            "health_score": health_score,
            "status": status,
            "is_anomaly": is_anomaly,
            "anomaly_score": score,
            "metrics": metrics,
            "issues": issues,
            "recommendations": self._generate_recommendations(issues),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def _extract_cluster_metrics(self, nodes: List[Dict], pods: List[Dict],
                                  events: List[Dict]) -> Dict[str, float]:
        """Extract numerical metrics from cluster data"""
        # Node metrics
        total_nodes = len(nodes)
        ready_nodes = sum(1 for n in nodes if n.get("status") == "Ready")
        
        # Pod metrics
        total_pods = len(pods)
        running_pods = sum(1 for p in pods if p.get("status") == "Running")
        failed_pods = sum(1 for p in pods if p.get("status") in ["Failed", "Error", "CrashLoopBackOff"])
        total_restarts = sum(p.get("restarts", 0) for p in pods)
        
        # Event metrics
        warning_events = sum(1 for e in events if e.get("type") == "Warning")
        error_events = sum(1 for e in events if "error" in e.get("message", "").lower())
        
        return {
            "node_count": float(total_nodes),
            "node_ready_percent": float(ready_nodes / total_nodes * 100) if total_nodes > 0 else 0,
            "pod_count": float(total_pods),
            "pod_running_percent": float(running_pods / total_pods * 100) if total_pods > 0 else 0,
            "pod_failed_count": float(failed_pods),
            "pod_restarts": float(total_restarts),
            "warning_events": float(warning_events),
            "error_events": float(error_events)
        }
    
    def _identify_issues(self, nodes: List[Dict], pods: List[Dict],
                         events: List[Dict]) -> List[Dict[str, Any]]:
        """Identify specific issues in the cluster"""
        issues = []
        
        # Check nodes
        for node in nodes:
            if node.get("status") != "Ready":
                issues.append({
                    "type": "node",
                    "severity": "critical",
                    "resource": node.get("name"),
                    "message": f"Node {node.get('name')} is not ready"
                })
        
        # Check pods
        for pod in pods:
            if pod.get("status") in ["Failed", "Error"]:
                issues.append({
                    "type": "pod",
                    "severity": "high",
                    "resource": pod.get("name"),
                    "namespace": pod.get("namespace"),
                    "message": f"Pod {pod.get('name')} is in {pod.get('status')} state"
                })
            elif pod.get("restarts", 0) > 3:
                issues.append({
                    "type": "pod",
                    "severity": "medium",
                    "resource": pod.get("name"),
                    "namespace": pod.get("namespace"),
                    "message": f"Pod {pod.get('name')} has {pod.get('restarts')} restarts"
                })
        
        # Check warning events
        for event in events:
            if event.get("type") == "Warning":
                issues.append({
                    "type": "event",
                    "severity": "low",
                    "resource": event.get("object"),
                    "message": event.get("message", "Unknown warning")
                })
        
        return issues
    
    def _generate_recommendations(self, issues: List[Dict]) -> List[str]:
        """Generate recommendations based on issues"""
        recommendations = []
        
        critical_count = sum(1 for i in issues if i.get("severity") == "critical")
        high_count = sum(1 for i in issues if i.get("severity") == "high")
        
        if critical_count > 0:
            recommendations.append("Immediately investigate critical node issues")
        
        if high_count > 0:
            recommendations.append("Review failed pods and check logs for errors")
        
        pod_restarts = [i for i in issues if "restarts" in i.get("message", "").lower()]
        if pod_restarts:
            recommendations.append("Investigate pods with high restart counts - possible memory leaks or crash loops")
        
        if not issues:
            recommendations.append("Cluster is healthy - continue monitoring")
        
        return recommendations
