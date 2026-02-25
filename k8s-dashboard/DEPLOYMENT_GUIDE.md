# 🚀 Deployment Guide: Deploy Your Apps to Kubernetes

This guide explains how to deploy your own containerized applications to the Kubernetes cluster and monitor them through the K8s Dashboard.

---

## **Quick 5-Step Deployment Process**

### **Step 1: Prepare Your Docker Image**

```bash
# Build your Docker image
docker build -t myapp:1.0 .

# Login to Docker Hub
docker login

# Tag your image
docker tag myapp:1.0 your-dockerhub-username/myapp:1.0

# Push to registry
docker push your-dockerhub-username/myapp:1.0
```

✅ Your image is now available to Kubernetes

---

### **Step 2: Create Kubernetes Deployment File**

Create `deployment.yaml` in your project:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: your-dockerhub-username/myapp:1.0
        ports:
        - containerPort: 3000  # Change to your app's port
        resources:
          requests:
            memory: "64Mi"
            cpu: "250m"
          limits:
            memory: "128Mi"
            cpu: "500m"
```

**Key Fields to Customize:**
- `name: myapp` - Your app name
- `image:` - Your Docker Hub image
- `containerPort: 3000` - Your app's exposed port
- `replicas: 3` - Number of pod copies

---

### **Step 3: Create Kubernetes Service File**

Create `service.yaml` in your project:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  selector:
    app: myapp
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000  # Must match containerPort above
  type: LoadBalancer
```

**Service Types:**
- `LoadBalancer` - External access (recommended)
- `ClusterIP` - Internal only
- `NodePort` - Node-level access

---

### **Step 4: Deploy to Kubernetes**

```bash
# Apply deployment
kubectl apply -f deployment.yaml

# Apply service
kubectl apply -f service.yaml

# Verify deployment
kubectl get deployments
kubectl get pods
kubectl get services
```

Expected output:
```
NAME                      READY   STATUS    RESTARTS   AGE
myapp-5d8b9c6d7-abc12     1/1     Running   0          10s
myapp-5d8b9c6d7-def34     1/1     Running   0          10s
myapp-5d8b9c6d7-ghi56     1/1     Running   0          10s
```

✅ Your app is now running on 3 pods

---

### **Step 5: Monitor in K8s Dashboard**

Open http://localhost:3000/user-dashboard and:

1. **Cluster Overview** - See your pods
2. **Workloads** - View your deployment status
3. **Pods** - Check individual pod health
4. **Metrics** - Monitor CPU and memory usage
5. **Logs** - View container output

---

## **Accessing Your App**

### **Method A: Via LoadBalancer (Recommended)**

```bash
# Get external IP
kubectl get services

# Output example:
# NAME              TYPE           CLUSTER-IP    EXTERNAL-IP      PORT(S)
# myapp-service     LoadBalancer   10.0.0.1      192.168.1.100    80:31234/TCP

# Visit your app
open http://192.168.1.100
```

### **Method B: Port Forwarding (Local Testing)**

```bash
# Forward local port 8080 to service port 80
kubectl port-forward service/myapp-service 8080:80

# Visit your app
open http://localhost:8080
```

### **Method C: Pod Port Forwarding (Debug)**

```bash
# Forward to specific pod
kubectl port-forward pod/myapp-5d8b9c6d7-abc12 8080:3000

# Visit
open http://localhost:8080
```

---

## **Useful Commands**

```bash
# View all resources
kubectl get all

# Describe a deployment
kubectl describe deployment myapp

# View pod logs
kubectl logs pod/myapp-5d8b9c6d7-abc12

# Tail logs (follow)
kubectl logs -f pod/myapp-5d8b9c6d7-abc12

# Execute command in pod
kubectl exec -it pod/myapp-5d8b9c6d7-abc12 -- /bin/sh

# Delete deployment
kubectl delete deployment myapp
kubectl delete service myapp-service

# Scale deployment
kubectl scale deployment myapp --replicas=5

# Update image
kubectl set image deployment/myapp myapp=your-dockerhub-username/myapp:2.0
```

---

## **Troubleshooting**

### **Pods are in CrashLoopBackOff**

```bash
# Check logs
kubectl logs pod/myapp-xxxxx

# Common issues:
# - Port mismatch
# - Missing environment variables
# - Application crash on startup
```

### **Service has no External IP**

```bash
# Check if LoadBalancer is supported in your cluster
kubectl get svc myapp-service

# Fallback to port-forward
kubectl port-forward service/myapp-service 8080:80
```

### **Image Pull Error**

```bash
# Verify image exists on Docker Hub
docker pull your-dockerhub-username/myapp:1.0

# Check image name in deployment.yaml matches exactly
```

### **Can't Connect to App**

```bash
# 1. Verify service is running
kubectl get svc

# 2. Check pod is ready
kubectl get pods

# 3. Test within cluster
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- curl http://myapp-service

# 4. Check container port
kubectl describe pod myapp-xxxxx | grep Port
```

---

## **Example Deployments**

See the `examples/` folder for ready-to-use templates:
- `examples/deployment.yaml` - Basic deployment template
- `examples/service.yaml` - Basic service template
- `examples/coffee-shop-deployment.yaml` - Full example with bean shop app

---

## **Next Steps**

✅ Deploy your app
✅ Verify in K8s Dashboard
✅ Monitor metrics and logs
✅ Scale if needed
✅ Update when new versions are ready

For more details, see [README.md](README.md) and the main [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md).
