# Kubernetes Cloud Management Dashboard - Setup Guide

A bachelor thesis project: Simplified cloud management dashboard for Kubernetes workloads with Minikube.

## Features

✅ **Authentication & Authorization**
- Login/Signup with role-based access (Admin & User)
- Admin: View cluster data + scale deployments
- User: Read-only access to all monitoring features

✅ **Project/Namespace Management**
- Select projects (Kubernetes namespaces) from sidebar
- All data automatically filtered by selected namespace
- Real-time namespace health monitoring

✅ **Kubernetes Integration**
- Real cluster connection via kubeconfig (~/.kube/config)
- Minikube support out of the box
- Falls back to demo mode if cluster unavailable

✅ **Real-Time Monitoring**
- Nodes, Pods, Deployments status
- CPU & Memory metrics (via metrics-server)
- Logs aggregation
- Cluster events tracking

✅ **Clean Admin Dashboard UI**
- Professional dark theme
- Cluster connection status indicator
- Project selector in sidebar
- Simple, clear navigation

## Prerequisites

- **Minikube** (v1.30+)
- **kubectl** configured
- **Docker** (for containerized deployment)
- **Node.js** 18+ (for frontend development)
- **Python** 3.11+ (for backend development)

## Quick Start

### 1. Start Minikube

```bash
# Start Minikube cluster
minikube start --driver=docker

# Enable metrics-server (required for CPU/Memory metrics)
minikube addons enable metrics-server

# Verify cluster is running
kubectl cluster-info
kubectl get nodes
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
copy .env.example .env

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: http://localhost:8000

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: http://localhost:5173

### 4. Default Login Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin`

**User Account:**
- Username: `user`
- Password: `user`

## Docker Deployment

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d

# Stop services
docker-compose down
```

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Project Structure

```
k8s-dashboard/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── auth.py            # Authentication & RBAC
│   │   │       ├── cluster.py         # Cluster operations
│   │   │       ├── namespaces.py      # Project/Namespace management (NEW)
│   │   │       ├── metrics.py         # Metrics collection
│   │   │       ├── logs.py            # Log aggregation
│   │   │       └── alerts.py          # Alert management
│   │   ├── services/
│   │   │   ├── kubernetes_service.py  # K8s client wrapper
│   │   │   └── anomaly_detector.py    # AI anomaly detection
│   │   ├── config.py           # Configuration
│   │   └── main.py            # FastAPI app
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                   # React + TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx             # Main layout with sidebar
│   │   │   ├── NamespaceSelector.tsx  # Project selector (NEW)
│   │   │   ├── ClusterStatus.tsx      # Connection status (NEW)
│   │   │   └── ui/
│   │   ├── pages/
│   │   │   ├── Login.tsx              # Login page
│   │   │   ├── Dashboard.tsx          # Main dashboard
│   │   │   ├── Pods.tsx              # Pod management
│   │   │   ├── Nodes.tsx             # Node monitoring
│   │   │   ├── Metrics.tsx           # Metrics visualization
│   │   │   └── ...
│   │   ├── services/
│   │   │   └── api.ts                # API client
│   │   └── store/
│   │       └── index.ts              # State management (Zustand)
│   ├── package.json
│   ├── Dockerfile
│   └── vite.config.ts
│
├── docker-compose.yml
└── README_SETUP.md (this file)
```

## Key Changes in This Refactor

### Backend Updates

1. **Namespace Management** (`namespaces.py`)
   - New `/api/v1/namespaces` endpoints
   - Namespace selection and filtering
   - Namespace health monitoring

2. **Enhanced Kubernetes Service**
   - Added `get_pod_metrics()` for metrics-server integration
   - Added `get_node_metrics()` for real CPU/Memory data
   - Better error handling and demo mode fallback

3. **Configuration Updates**
   - Added namespace management settings
   - Session configuration
   - Kubeconfig path configuration

### Frontend Updates

1. **Namespace Selector Component**
   - Dropdown in sidebar to select project/namespace
   - Shows pod count for each namespace
   - Persists selection in localStorage

2. **Cluster Status Component**
   - Real-time connection status indicator
   - Shows Kubernetes version
   - Demo mode indication

3. **Updated Store**
   - `selectedNamespace` state management
   - Automatic namespace filtering
   - Available namespaces list

4. **Page Updates**
   - All pages now use `selectedNamespace` from store
   - Removed duplicate namespace selectors
   - Cleaner UI with namespace badge

## Usage Guide

### 1. Login
- Navigate to http://localhost:5173
- Use default credentials (admin/admin or user/user)
- You'll be redirected based on your role

### 2. Select Project/Namespace
- Use the dropdown in the sidebar (below cluster status)
- All data will automatically filter to selected namespace
- Selection persists across page navigation

### 3. Monitor Cluster
- **Dashboard**: Overview of cluster health
- **Nodes**: View node status and resources
- **Pods**: Monitor pods in selected namespace
- **Deployments**: View and manage deployments (admin only)
- **Metrics**: Real-time CPU/Memory charts
- **Logs**: Aggregated logs from pods
- **Alerts**: AI-powered anomaly detection

### 4. Admin Actions (Admin Only)
- Scale deployments
- Restart pods
- Manage users

## Connecting to Real Minikube Cluster

The dashboard automatically connects to your Minikube cluster using `~/.kube/config`.

**Verify connection:**
1. Check cluster status indicator in sidebar (should show green "Connected")
2. If showing "Demo Mode", verify:
   - Minikube is running: `minikube status`
   - kubectl can connect: `kubectl get nodes`
   - kubeconfig is accessible: `ls ~/.kube/config`

## Metrics Server Setup

For real CPU/Memory metrics:

```bash
# Enable metrics-server in Minikube
minikube addons enable metrics-server

# Verify it's running
kubectl get deployment metrics-server -n kube-system

# Test metrics
kubectl top nodes
kubectl top pods
```

## Troubleshooting

### Backend won't connect to cluster
```bash
# Check if kubeconfig is correct
kubectl config view

# Verify current context
kubectl config current-context

# Should show: minikube

# Test connection
kubectl get nodes
```

### Metrics not showing
```bash
# Enable metrics-server
minikube addons enable metrics-server

# Wait 30 seconds then verify
kubectl top nodes
```

### Frontend can't reach backend
- Check backend is running: http://localhost:8000/health
- Check CORS settings in `backend/app/config.py`
- Verify API_BASE_URL in frontend (should be `/api/v1`)

### Docker deployment issues
```bash
# Check if ports are available
netstat -an | findstr "8000 3000"

# View container logs
docker-compose logs backend
docker-compose logs frontend

# Rebuild containers
docker-compose down
docker-compose up --build
```

## Development Notes

### Adding New Namespaces
Simply create them in Kubernetes:
```bash
kubectl create namespace my-project
kubectl get namespaces
```
They'll automatically appear in the dashboard selector.

### Demo Mode
If no cluster is available, the dashboard runs in demo mode with simulated data. This is useful for:
- Development without cluster
- Presentations
- Testing UI changes

### Authentication
For production:
1. Change `SECRET_KEY` in `.env`
2. Use proper password hashing (already implemented)
3. Consider adding OAuth/SSO
4. Store users in database instead of memory

## Academic Context

This project is designed for a bachelor thesis with these constraints:
- ✅ Simple and readable code
- ✅ Focus on monitoring (not deployment/CI/CD)
- ✅ Local Kubernetes (Minikube, not cloud)
- ✅ Single cluster (no multi-cluster)
- ✅ Clear separation of concerns
- ✅ Easy to explain and demonstrate

## API Documentation

Once backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Tech Stack Summary

**Backend:**
- FastAPI (Python web framework)
- Kubernetes Python Client
- scikit-learn (Anomaly detection)
- JWT authentication

**Frontend:**
- React 18 + TypeScript
- Vite (Build tool)
- TailwindCSS (Styling)
- React Query (Data fetching)
- Zustand (State management)
- Recharts (Data visualization)

**Infrastructure:**
- Minikube (Local Kubernetes)
- metrics-server (Resource metrics)
- Docker (Containerization)

## Next Steps

1. ✅ Start Minikube
2. ✅ Enable metrics-server
3. ✅ Start backend and frontend
4. ✅ Login with default credentials
5. ✅ Select a namespace
6. ✅ Explore the dashboard

For questions or issues, check the API documentation or review the code comments.

---

**Bachelor Thesis Project**  
**Author**: OUSSAMA ESSABTI  
**Date**: February 2026  
**Focus**: Kubernetes Cluster Monitoring & Management Dashboard
