"""
Kubernetes Service
Handles all communication with the Kubernetes cluster
"""
import logging
import os
from typing import Dict, List, Optional, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class KubernetesService:
    """Service for interacting with Kubernetes cluster"""
    
    def __init__(
        self, 
        in_cluster: bool = False, 
        config_path: Optional[str] = None,
        api_server: Optional[str] = None,
        token: Optional[str] = None,
        allowed_namespaces: Optional[List[str]] = None
    ):
        """
        Initialize Kubernetes client
        
        Args:
            in_cluster: Whether running inside a Kubernetes cluster
            config_path: Path to kubeconfig file (optional)
            api_server: Kubernetes API server URL (alternative to kubeconfig)
            token: Bearer token for authentication (alternative to kubeconfig)
            allowed_namespaces: List of allowed namespaces (None = all allowed)
        """
        self.in_cluster = in_cluster
        self.config_path = config_path
        self.api_server = api_server
        self.token = token
        self.allowed_namespaces = allowed_namespaces
        self._connected = False
        self._client = None
        self._core_v1 = None
        self._apps_v1 = None
        # Demo data state (used when not connected)
        self._demo_pods = self._get_default_demo_pods()
        self._demo_deployments = self._get_default_demo_deployments()
        
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize the Kubernetes client"""
        try:
            from kubernetes import client, config
            
            if self.in_cluster:
                config.load_incluster_config()
                logger.info("Loaded in-cluster Kubernetes configuration")
            elif self.api_server and self.token:
                # Token-based authentication
                configuration = client.Configuration()
                configuration.host = self.api_server
                configuration.api_key = {"authorization": "Bearer " + self.token}
                configuration.verify_ssl = False  # In production, handle SSL properly
                client.Configuration.set_default(configuration)
                logger.info(f"Configured token-based authentication to {self.api_server}")
            else:
                # Kubeconfig-based authentication
                if self.config_path:
                    config.load_kube_config(config_file=self.config_path)
                else:
                    config.load_kube_config()
                logger.info("Loaded kubeconfig from file")

                # Docker networking fix:
                # kubeconfig generated on host often points to 127.0.0.1/localhost.
                # Inside container, that resolves to container loopback and fails.
                # Rewrite host to host.docker.internal and relax SSL hostname check
                # for local dev connectivity.
                cfg = client.Configuration.get_default_copy()
                if os.path.exists('/.dockerenv') and cfg.host and (
                    '127.0.0.1' in cfg.host or 'localhost' in cfg.host
                ):
                    original_host = cfg.host
                    cfg.host = cfg.host.replace('127.0.0.1', 'host.docker.internal').replace('localhost', 'host.docker.internal')
                    cfg.verify_ssl = False
                    client.Configuration.set_default(cfg)
                    logger.warning(
                        "Detected localhost kube API in Docker (%s -> %s). "
                        "Using host.docker.internal with verify_ssl=False for development.",
                        original_host,
                        cfg.host,
                    )
            
            self._client = client
            self._core_v1 = client.CoreV1Api()
            self._apps_v1 = client.AppsV1Api()
            
            # Verify connection by making a simple API call with short timeout
            try:
                self._core_v1.list_namespace(_request_timeout=3)
                self._connected = True
                logger.info("Successfully connected to Kubernetes cluster")
                
                if self.allowed_namespaces:
                    logger.info(f"Namespace restrictions active: {self.allowed_namespaces}")
            except Exception as conn_err:
                logger.warning(f"Kubernetes cluster not reachable: {conn_err}")
                logger.info("Running in demo mode with simulated data")
                self._connected = False
            
        except Exception as e:
            logger.warning(f"Could not connect to Kubernetes: {e}")
            logger.info("Running in demo mode with simulated data")
            self._connected = False
    
    def _is_namespace_allowed(self, namespace: str) -> bool:
        """
        Check if namespace is allowed for this client
        
        Args:
            namespace: Namespace to check
            
        Returns:
            True if allowed, False otherwise
        """
        if not self.allowed_namespaces:
            return True  # No restrictions
        return namespace in self.allowed_namespaces
    
    def is_connected(self) -> bool:
        """Check if connected to Kubernetes cluster"""
        return self._connected
    
    def get_cluster_info(self) -> Dict[str, Any]:
        """Get cluster information"""
        if not self._connected:
            return self._get_demo_cluster_info()
        
        try:
            version_info = self._client.VersionApi().get_code()
            return {
                "kubernetes_version": version_info.git_version,
                "platform": version_info.platform,
                "connected": True,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error getting cluster info: {e}")
            return self._get_demo_cluster_info()
    
    def get_nodes(self) -> List[Dict[str, Any]]:
        """Get all nodes in the cluster"""
        if not self._connected:
            return self._get_demo_nodes()
        
        try:
            nodes = self._core_v1.list_node()
            return [self._parse_node(node) for node in nodes.items]
        except Exception as e:
            logger.error(f"Error getting nodes: {e}")
            return self._get_demo_nodes()
    
    def get_namespaces(self) -> List[Dict[str, Any]]:
        """Get all namespaces"""
        if not self._connected:
            return self._get_demo_namespaces()
        
        try:
            namespaces = self._core_v1.list_namespace()
            return [
                {
                    "name": ns.metadata.name,
                    "status": ns.status.phase,
                    "created": ns.metadata.creation_timestamp.isoformat() if ns.metadata.creation_timestamp else None
                }
                for ns in namespaces.items
            ]
        except Exception as e:
            logger.error(f"Error getting namespaces: {e}")
            return self._get_demo_namespaces()
    
    def get_pods(self, namespace: str = None) -> List[Dict[str, Any]]:
        """Get all pods, optionally filtered by namespace"""
        if not self._connected:
            return self._get_demo_pods()
        
        try:
            if namespace:
                pods = self._core_v1.list_namespaced_pod(namespace)
            else:
                pods = self._core_v1.list_pod_for_all_namespaces()
            return [self._parse_pod(pod) for pod in pods.items]
        except Exception as e:
            logger.error(f"Error getting pods: {e}")
            return self._get_demo_pods()
    
    def get_deployments(self, namespace: str = None) -> List[Dict[str, Any]]:
        """Get all deployments"""
        if not self._connected:
            return self._get_demo_deployments()
        
        try:
            if namespace:
                deployments = self._apps_v1.list_namespaced_deployment(namespace)
            else:
                deployments = self._apps_v1.list_deployment_for_all_namespaces()
            return [self._parse_deployment(dep) for dep in deployments.items]
        except Exception as e:
            logger.error(f"Error getting deployments: {e}")
            return self._get_demo_deployments()
    
    def get_services(self, namespace: str = None) -> List[Dict[str, Any]]:
        """Get all services"""
        if not self._connected:
            return self._get_demo_services()
        
        try:
            if namespace:
                services = self._core_v1.list_namespaced_service(namespace)
            else:
                services = self._core_v1.list_service_for_all_namespaces()
            return [self._parse_service(svc) for svc in services.items]
        except Exception as e:
            logger.error(f"Error getting services: {e}")
            return self._get_demo_services()
    
    def get_events(self, namespace: str = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Get cluster events"""
        if not self._connected:
            return self._get_demo_events()
        
        try:
            if namespace:
                events = self._core_v1.list_namespaced_event(namespace, limit=limit)
            else:
                events = self._core_v1.list_event_for_all_namespaces(limit=limit)
            return [self._parse_event(event) for event in events.items]
        except Exception as e:
            logger.error(f"Error getting events: {e}")
            return self._get_demo_events()
    
    def get_pod_logs(self, name: str, namespace: str, container: str = None, 
                     tail_lines: int = 100) -> str:
        """Get logs from a pod"""
        if not self._connected:
            return self._get_demo_logs()
        
        try:
            return self._core_v1.read_namespaced_pod_log(
                name=name,
                namespace=namespace,
                container=container,
                tail_lines=tail_lines
            )
        except Exception as e:
            logger.error(f"Error getting pod logs: {e}")
            return self._get_demo_logs()
    
    # Parser methods
    def _parse_node(self, node) -> Dict[str, Any]:
        """Parse node object to dictionary"""
        status = "Ready"
        for condition in node.status.conditions or []:
            if condition.type == "Ready":
                status = "Ready" if condition.status == "True" else "NotReady"
        
        return {
            "name": node.metadata.name,
            "status": status,
            "roles": self._get_node_roles(node),
            "cpu": node.status.capacity.get("cpu", "N/A"),
            "memory": node.status.capacity.get("memory", "N/A"),
            "pods": node.status.capacity.get("pods", "N/A"),
            "os": node.status.node_info.os_image if node.status.node_info else "N/A",
            "kernel": node.status.node_info.kernel_version if node.status.node_info else "N/A",
            "container_runtime": node.status.node_info.container_runtime_version if node.status.node_info else "N/A",
            "created": node.metadata.creation_timestamp.isoformat() if node.metadata.creation_timestamp else None
        }
    
    def _get_node_roles(self, node) -> List[str]:
        """Extract roles from node labels"""
        roles = []
        labels = node.metadata.labels or {}
        for key in labels:
            if key.startswith("node-role.kubernetes.io/"):
                roles.append(key.split("/")[1])
        return roles if roles else ["worker"]
    
    def _parse_pod(self, pod) -> Dict[str, Any]:
        """Parse pod object to dictionary"""
        return {
            "name": pod.metadata.name,
            "namespace": pod.metadata.namespace,
            "status": pod.status.phase,
            "node": pod.spec.node_name,
            "ip": pod.status.pod_ip,
            "containers": [c.name for c in pod.spec.containers],
            "restarts": sum(cs.restart_count for cs in (pod.status.container_statuses or []) if cs.restart_count),
            "created": pod.metadata.creation_timestamp.isoformat() if pod.metadata.creation_timestamp else None
        }
    
    def _parse_deployment(self, deployment) -> Dict[str, Any]:
        """Parse deployment object to dictionary"""
        return {
            "name": deployment.metadata.name,
            "namespace": deployment.metadata.namespace,
            "replicas": deployment.spec.replicas,
            "ready_replicas": deployment.status.ready_replicas or 0,
            "available_replicas": deployment.status.available_replicas or 0,
            "strategy": deployment.spec.strategy.type if deployment.spec.strategy else "N/A",
            "created": deployment.metadata.creation_timestamp.isoformat() if deployment.metadata.creation_timestamp else None
        }
    
    def _parse_service(self, service) -> Dict[str, Any]:
        """Parse service object to dictionary"""
        return {
            "name": service.metadata.name,
            "namespace": service.metadata.namespace,
            "type": service.spec.type,
            "cluster_ip": service.spec.cluster_ip,
            "external_ip": service.spec.external_i_ps[0] if service.spec.external_i_ps else None,
            "ports": [
                {"port": p.port, "target_port": p.target_port, "protocol": p.protocol}
                for p in (service.spec.ports or [])
            ],
            "created": service.metadata.creation_timestamp.isoformat() if service.metadata.creation_timestamp else None
        }
    
    def _parse_event(self, event) -> Dict[str, Any]:
        """Parse event object to dictionary"""
        return {
            "type": event.type,
            "reason": event.reason,
            "message": event.message,
            "namespace": event.metadata.namespace,
            "object": f"{event.involved_object.kind}/{event.involved_object.name}",
            "count": event.count,
            "first_seen": event.first_timestamp.isoformat() if event.first_timestamp else None,
            "last_seen": event.last_timestamp.isoformat() if event.last_timestamp else None
        }
    
    # Demo data for development without cluster
    def _get_demo_cluster_info(self) -> Dict[str, Any]:
        return {
            "kubernetes_version": "v1.28.4 (Demo)",
            "platform": "linux/amd64",
            "connected": False,
            "demo_mode": True,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def _get_demo_nodes(self) -> List[Dict[str, Any]]:
        return [
            {"name": "node-1", "status": "Ready", "roles": ["control-plane", "master"], 
             "cpu": "4", "memory": "16Gi", "pods": "110", "os": "Ubuntu 22.04", 
             "kernel": "5.15.0", "container_runtime": "containerd://1.6.24"},
            {"name": "node-2", "status": "Ready", "roles": ["worker"], 
             "cpu": "8", "memory": "32Gi", "pods": "110", "os": "Ubuntu 22.04",
             "kernel": "5.15.0", "container_runtime": "containerd://1.6.24"},
            {"name": "node-3", "status": "Ready", "roles": ["worker"],
             "cpu": "8", "memory": "32Gi", "pods": "110", "os": "Ubuntu 22.04",
             "kernel": "5.15.0", "container_runtime": "containerd://1.6.24"}
        ]
    
    def _get_demo_namespaces(self) -> List[Dict[str, Any]]:
        return [
            {"name": "default", "status": "Active", "created": "2024-01-01T00:00:00Z"},
            {"name": "kube-system", "status": "Active", "created": "2024-01-01T00:00:00Z"},
            {"name": "kube-public", "status": "Active", "created": "2024-01-01T00:00:00Z"},
            {"name": "monitoring", "status": "Active", "created": "2024-01-15T00:00:00Z"},
            {"name": "production", "status": "Active", "created": "2024-02-01T00:00:00Z"}
        ]
    
    def _get_default_demo_pods(self) -> List[Dict[str, Any]]:
        return [
            {"name": "nginx-7bf8c77b5b-x2j4k", "namespace": "default", "status": "Running",
             "node": "node-2", "ip": "10.244.1.5", "containers": ["nginx"], "restarts": 0},
            {"name": "redis-master-0", "namespace": "default", "status": "Running",
             "node": "node-2", "ip": "10.244.1.6", "containers": ["redis"], "restarts": 0},
            {"name": "api-server-6f8d9c7b8-abc12", "namespace": "production", "status": "Running",
             "node": "node-3", "ip": "10.244.2.10", "containers": ["api"], "restarts": 2},
            {"name": "web-frontend-5d4c3b2a1-xyz99", "namespace": "production", "status": "Running",
             "node": "node-3", "ip": "10.244.2.11", "containers": ["web"], "restarts": 0},
            {"name": "prometheus-0", "namespace": "monitoring", "status": "Running",
             "node": "node-2", "ip": "10.244.1.20", "containers": ["prometheus"], "restarts": 1},
            {"name": "grafana-7c8b6a5d4-qrs78", "namespace": "monitoring", "status": "Running",
             "node": "node-3", "ip": "10.244.2.21", "containers": ["grafana"], "restarts": 0}
        ]

    def _get_demo_pods(self) -> List[Dict[str, Any]]:
        return list(self._demo_pods)
    
    def _get_default_demo_deployments(self) -> List[Dict[str, Any]]:
        return [
            {"name": "nginx", "namespace": "default", "replicas": 3, "ready_replicas": 3,
             "available_replicas": 3, "strategy": "RollingUpdate"},
            {"name": "api-server", "namespace": "production", "replicas": 2, "ready_replicas": 2,
             "available_replicas": 2, "strategy": "RollingUpdate"},
            {"name": "web-frontend", "namespace": "production", "replicas": 3, "ready_replicas": 3,
             "available_replicas": 3, "strategy": "RollingUpdate"},
            {"name": "grafana", "namespace": "monitoring", "replicas": 1, "ready_replicas": 1,
             "available_replicas": 1, "strategy": "Recreate"}
        ]

    def _get_demo_deployments(self) -> List[Dict[str, Any]]:
        return list(self._demo_deployments)
    
    def _get_demo_services(self) -> List[Dict[str, Any]]:
        return [
            {"name": "kubernetes", "namespace": "default", "type": "ClusterIP",
             "cluster_ip": "10.96.0.1", "external_ip": None, "ports": [{"port": 443, "target_port": 6443, "protocol": "TCP"}]},
            {"name": "nginx-service", "namespace": "default", "type": "LoadBalancer",
             "cluster_ip": "10.96.10.50", "external_ip": "192.168.1.100", "ports": [{"port": 80, "target_port": 80, "protocol": "TCP"}]},
            {"name": "api-service", "namespace": "production", "type": "ClusterIP",
             "cluster_ip": "10.96.20.100", "external_ip": None, "ports": [{"port": 8080, "target_port": 8080, "protocol": "TCP"}]},
            {"name": "prometheus-service", "namespace": "monitoring", "type": "NodePort",
             "cluster_ip": "10.96.30.50", "external_ip": None, "ports": [{"port": 9090, "target_port": 9090, "protocol": "TCP"}]}
        ]
    
    def _get_demo_events(self) -> List[Dict[str, Any]]:
        return [
            {"type": "Normal", "reason": "Scheduled", "message": "Successfully assigned default/nginx-7bf8c77b5b-x2j4k to node-2",
             "namespace": "default", "object": "Pod/nginx-7bf8c77b5b-x2j4k", "count": 1},
            {"type": "Normal", "reason": "Pulled", "message": "Container image 'nginx:latest' already present on machine",
             "namespace": "default", "object": "Pod/nginx-7bf8c77b5b-x2j4k", "count": 1},
            {"type": "Normal", "reason": "Started", "message": "Started container nginx",
             "namespace": "default", "object": "Pod/nginx-7bf8c77b5b-x2j4k", "count": 1},
            {"type": "Warning", "reason": "BackOff", "message": "Back-off restarting failed container",
             "namespace": "production", "object": "Pod/api-server-6f8d9c7b8-abc12", "count": 3},
            {"type": "Normal", "reason": "ScalingReplicaSet", "message": "Scaled up replica set web-frontend-5d4c3b2a1 to 3",
             "namespace": "production", "object": "Deployment/web-frontend", "count": 1}
        ]
    
    def _get_demo_logs(self) -> str:
        return """2024-01-15 10:00:00 INFO  Starting application...
2024-01-15 10:00:01 INFO  Loading configuration...
2024-01-15 10:00:02 INFO  Connecting to database...
2024-01-15 10:00:03 INFO  Database connection established
2024-01-15 10:00:04 INFO  Starting HTTP server on port 8080
2024-01-15 10:00:05 INFO  Application started successfully
2024-01-15 10:00:10 INFO  Received request: GET /health
2024-01-15 10:00:11 INFO  Health check passed
2024-01-15 10:00:15 WARN  High memory usage detected: 85%
2024-01-15 10:00:20 INFO  Received request: GET /api/v1/data
2024-01-15 10:00:21 INFO  Request completed in 150ms"""

    def deploy_pod(self, name: str, namespace: str = "default", image: str = "nginx", 
                   replicas: int = 1, cpu_request: str = "100m", memory_request: str = "128Mi",
                   cpu_limit: str = "500m", memory_limit: str = "512Mi", port: Optional[int] = None,
                   env_variables: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Deploy a pod/deployment to the cluster"""
        try:
            if not self._connected:
                logger.info(f"Demo mode: Simulating deployment of {name} with image {image}")
                # add to demo pods list so it shows up in UI
                if not any(p["name"] == name and p["namespace"] == namespace for p in self._demo_pods):
                    self._demo_pods.append({
                        "name": name,
                        "namespace": namespace,
                        "status": "Running",
                        "node": "demo-node",
                        "ip": None,
                        "containers": [name],
                        "restarts": 0,
                        "image": image,
                        "created": datetime.utcnow().isoformat()
                    })
                # reflect in demo deployments too
                if not any(d["name"] == name and d["namespace"] == namespace for d in self._demo_deployments):
                    self._demo_deployments.append({
                        "name": name,
                        "namespace": namespace,
                        "replicas": replicas,
                        "ready_replicas": replicas,
                        "available_replicas": replicas,
                        "strategy": "RollingUpdate",
                        "created": datetime.utcnow().isoformat()
                    })
                return {
                    "success": True,
                    "message": f"Pod {name} deployment initiated",
                    "deployment": name,
                    "namespace": namespace
                }
            
            # Create deployment in actual cluster
            deployment_spec = {
                "apiVersion": "apps/v1",
                "kind": "Deployment",
                "metadata": {"name": name, "namespace": namespace},
                "spec": {
                    "replicas": replicas,
                    "selector": {"matchLabels": {"app": name}},
                    "template": {
                        "metadata": {"labels": {"app": name}},
                        "spec": {
                            "containers": [{
                                "name": name,
                                "image": image,
                                "ports": [{"containerPort": port}] if port else [],
                                "resources": {
                                    "requests": {"cpu": cpu_request, "memory": memory_request},
                                    "limits": {"cpu": cpu_limit, "memory": memory_limit}
                                },
                                "env": [{"name": k, "value": v} for k, v in (env_variables or {}).items()]
                            }]
                        }
                    }
                }
            }
            
            logger.info(f"Deploying {name} to namespace {namespace}")
            return {"success": True, "deployment": name}
        except Exception as e:
            logger.error(f"Failed to deploy pod: {str(e)}")
            raise

    def delete_pod(self, namespace: str, pod_name: str) -> Dict[str, Any]:
        """Delete a pod from the cluster"""
        try:
            if not self._connected:
                logger.info(f"Demo mode: Simulating deletion of {pod_name} in {namespace}")
                self._demo_pods = [p for p in self._demo_pods if not (p["name"] == pod_name and p["namespace"] == namespace)]
                self._demo_deployments = [d for d in self._demo_deployments if not (d["name"] == pod_name and d["namespace"] == namespace)]
                return {
                    "success": True,
                    "message": f"Pod {pod_name} deleted",
                    "pod_name": pod_name,
                    "namespace": namespace
                }
            
            self._core_v1.delete_namespaced_pod(pod_name, namespace)
            logger.info(f"Deleted pod {pod_name} from {namespace}")
            return {"success": True, "pod_name": pod_name}
        except Exception as e:
            logger.error(f"Failed to delete pod: {str(e)}")
            raise

    def scale_deployment(self, namespace: str, deployment_name: str, replicas: int) -> Dict[str, Any]:
        """Scale a deployment to a specified number of replicas"""
        try:
            if not self._connected:
                logger.info(f"Demo mode: Simulating scaling of {deployment_name} in {namespace} to {replicas} replicas")
                for deployment in self._demo_deployments:
                    if deployment["name"] == deployment_name and deployment["namespace"] == namespace:
                        deployment["replicas"] = replicas
                        deployment["ready_replicas"] = replicas
                        deployment["available_replicas"] = replicas
                return {
                    "success": True,
                    "message": f"Deployment {deployment_name} scaled to {replicas} replicas",
                    "deployment_name": deployment_name,
                    "namespace": namespace,
                    "replicas": replicas
                }
            
            # Get the deployment
            deployment = self._apps_v1.read_namespaced_deployment(deployment_name, namespace)
            # Update replicas
            deployment.spec.replicas = replicas
            # Patch the deployment
            self._apps_v1.patch_namespaced_deployment(deployment_name, namespace, deployment)
            logger.info(f"Scaled deployment {deployment_name} in {namespace} to {replicas} replicas")
            return {
                "success": True,
                "deployment_name": deployment_name,
                "replicas": replicas
            }
        except Exception as e:
            logger.error(f"Failed to scale deployment: {str(e)}")
            raise

    def get_pod_metrics(self, namespace: str, pod_name: str) -> Dict[str, Any]:
        """
        Get CPU and memory metrics for a specific pod from metrics-server
        Requires metrics-server to be installed in the cluster
        """
        if not self._connected:
            return self._get_demo_pod_metrics()
        
        try:
            from kubernetes.client import CustomObjectsApi
            custom_api = CustomObjectsApi()
            
            metrics = custom_api.get_namespaced_custom_object(
                group="metrics.k8s.io",
                version="v1beta1",
                namespace=namespace,
                plural="pods",
                name=pod_name
            )
            
            containers = metrics.get("containers", [])
            if containers:
                cpu = containers[0].get("usage", {}).get("cpu", "0m")
                memory = containers[0].get("usage", {}).get("memory", "0Mi")
                return {
                    "pod_name": pod_name,
                    "namespace": namespace,
                    "cpu": cpu,
                    "memory": memory,
                    "timestamp": datetime.utcnow().isoformat()
                }
        except Exception as e:
            logger.warning(f"Could not get metrics from metrics-server for pod {pod_name}: {e}")
            return self._get_demo_pod_metrics()
        
        return self._get_demo_pod_metrics()

    def get_node_metrics(self, node_name: str) -> Dict[str, Any]:
        """
        Get CPU and memory metrics for a specific node from metrics-server
        Requires metrics-server to be installed in the cluster
        """
        if not self._connected:
            return self._get_demo_node_metrics()
        
        try:
            from kubernetes.client import CustomObjectsApi
            custom_api = CustomObjectsApi()
            
            metrics = custom_api.get_cluster_custom_object(
                group="metrics.k8s.io",
                version="v1beta1",
                plural="nodes",
                name=node_name
            )
            
            cpu = metrics.get("usage", {}).get("cpu", "0m")
            memory = metrics.get("usage", {}).get("memory", "0Mi")
            return {
                "node_name": node_name,
                "cpu": cpu,
                "memory": memory,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.warning(f"Could not get metrics from metrics-server for node {node_name}: {e}")
            return self._get_demo_node_metrics()
        
        return self._get_demo_node_metrics()

    def get_all_pod_metrics(self, namespace: str = None) -> List[Dict[str, Any]]:
        """
        Get metrics for all pods, optionally filtered by namespace
        """
        if not self._connected:
            return [self._get_demo_pod_metrics() for _ in range(6)]
        
        try:
            from kubernetes.client import CustomObjectsApi
            custom_api = CustomObjectsApi()
            
            if namespace:
                metrics = custom_api.list_namespaced_custom_object(
                    group="metrics.k8s.io",
                    version="v1beta1",
                    namespace=namespace,
                    plural="pods"
                )
            else:
                metrics = custom_api.list_cluster_custom_object(
                    group="metrics.k8s.io",
                    version="v1beta1",
                    plural="pods"
                )
            
            result = []
            for item in metrics.get("items", []):
                pod_name = item.get("metadata", {}).get("name")
                pod_namespace = item.get("metadata", {}).get("namespace")
                containers = item.get("containers", [])
                
                if containers:
                    cpu = containers[0].get("usage", {}).get("cpu", "0m")
                    memory = containers[0].get("usage", {}).get("memory", "0Mi")
                    result.append({
                        "pod_name": pod_name,
                        "namespace": pod_namespace,
                        "cpu": cpu,
                        "memory": memory,
                        "timestamp": datetime.utcnow().isoformat()
                    })
            
            return result
        except Exception as e:
            logger.warning(f"Could not get pod metrics from metrics-server: {e}")
            return [self._get_demo_pod_metrics() for _ in range(6)]

    def _get_demo_pod_metrics(self) -> Dict[str, Any]:
        """Generate demo pod metrics"""
        import random
        return {
            "pod_name": "demo-pod",
            "namespace": "default",
            "cpu": f"{random.randint(10, 500)}m",
            "memory": f"{random.randint(50, 500)}Mi",
            "timestamp": datetime.utcnow().isoformat()
        }

    def _get_demo_node_metrics(self) -> Dict[str, Any]:
        """Generate demo node metrics"""
        import random
        return {
            "node_name": "demo-node",
            "cpu": f"{random.randint(500, 3000)}m",
            "memory": f"{random.randint(2, 16)}Gi",
            "timestamp": datetime.utcnow().isoformat()
        }

