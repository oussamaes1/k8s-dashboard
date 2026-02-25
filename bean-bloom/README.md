# ☕ Bean & Bloom Coffee Shop

A simple demo application to deploy to Kubernetes and monitor via the K8s Dashboard.

## 🚀 Quick Deploy to Kubernetes

### Step 1: Build and Push Docker Image

```bash
# Build the image
docker build -t your-dockerhub-username/bean-bloom:1.0 .

# Login to Docker Hub
docker login

# Push to Docker Hub
docker push your-dockerhub-username/bean-bloom:1.0
```

**⚠️ Important:** Replace `your-dockerhub-username` with your actual Docker Hub username!

### Step 2: Update Deployment File

Edit `deployment.yaml` line 22:
```yaml
image: YOUR-USERNAME/bean-bloom:1.0
```

### Step 3: Deploy to Kubernetes

```bash
# Apply the deployment
kubectl apply -f deployment.yaml

# Verify it's running
kubectl get pods
kubectl get deployments
kubectl get services
```

### Step 4: Access the Application

```bash
# Get the service URL
kubectl get services bean-bloom-service

# Port forward for local access
kubectl port-forward service/bean-bloom-service 8080:80

# Open in browser
http://localhost:8080
```

### Step 5: Monitor in K8s Dashboard

1. Open http://localhost:3000 (your K8s Dashboard)
2. Navigate to **Cluster Overview**
3. See your **bean-bloom** pods running!
4. Check **Metrics** for CPU/memory usage
5. View **Logs** from each pod

## 📊 What You'll See in Dashboard

- **3 replicas** of bean-bloom pods
- **Real-time metrics** (CPU, memory)
- **Pod logs** showing requests
- **Health status** of each pod
- **Resource usage** graphs

## 🧪 Test the Application

```bash
# Visit the homepage
curl http://localhost:8080

# Check health endpoint
curl http://localhost:8080/health

# Get coffee shop stats
curl http://localhost:8080/api/stats
```

## 🛠️ Useful Commands

```bash
# Scale up to 5 replicas
kubectl scale deployment bean-bloom --replicas=5

# View logs
kubectl logs -l app=bean-bloom

# Describe deployment
kubectl describe deployment bean-bloom

# Delete deployment
kubectl delete -f deployment.yaml
```

## 📝 Project Structure

```
bean-bloom/
├── index.js           # Node.js Express application
├── package.json       # NPM dependencies
├── Dockerfile         # Docker build instructions
├── deployment.yaml    # Kubernetes deployment config
└── README.md          # This file
```

## 🎯 Features

- ✅ Simple Express.js web server
- ✅ Health check endpoint
- ✅ API endpoints for stats
- ✅ Beautiful coffee shop UI
- ✅ Kubernetes-ready
- ✅ Resource limits configured
- ✅ Liveness and readiness probes

Enjoy monitoring your coffee shop! ☕🌸
