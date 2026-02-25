# Kubernetes Cluster Monitoring Dashboard
## A Decision-Support Prototype for Cluster Observability

A web-based monitoring prototype designed to assist human operators in observing and analyzing Kubernetes cluster behavior through data aggregation, visualization, and unsupervised anomaly scoring.

## Project Overview

This project is a bachelor graduation thesis for the degree in Computer Science at the School of Computing and Artificial Intelligence. It represents an educational exploration of cluster observability techniques, combining web development, API integration, and basic machine learning.

**Author:** OUSSAMA ESSABTI  
**Advisor:** Lai Xinfeng  
**Date:** January 2026  
**Scope:** Proof-of-concept prototype for academic demonstration

## System Capabilities

**What the System Does:**
- 📊 **Cluster Resource Display** - Aggregates and presents node, pod, and deployment status from Kubernetes API
- 🔍 **Read-Only Monitoring** - Observes cluster state without modifying resources
- 📈 **Metrics Visualization** - Displays CPU, memory, and restart metrics in time-series charts
- 📝 **Log Aggregation** - Centralizes log viewing from multiple pods
- 🔬 **Anomaly Scoring** - Applies Isolation Forest algorithm to highlight unusual metric patterns
- 📋 **Event Correlation** - Presents related events, metrics, and logs in unified views
- 👥 **Role-Based Access** - Separates admin and user viewing permissions
- 🎯 **Namespace Navigation** - Filters resources by Kubernetes namespace

**Important Limitations:**
- ⚠️ **No Autonomous Actions** - Does not deploy, scale, restart, or modify cluster resources
- ⚠️ **No Causal Inference** - Cannot determine root causes; provides correlation-based analysis only
- ⚠️ **No Guaranteed Accuracy** - Anomaly detection depends on data quality and historical baselines
- ⚠️ **Human Decision Required** - All interpretations and actions remain under operator control

## System Architecture

The system consists of two containerized components that connect to an existing Kubernetes cluster via kubeconfig authentication. No components are deployed inside the monitored cluster.

```
┌─────────────────────────────────────────────────────────────────┐
│                Frontend (React + TypeScript)                     │
│         Data Visualization │ Charts │ Tables │ Navigation       │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTP REST API
┌─────────────────────────────┴───────────────────────────────────┐
│                    Backend (Python/FastAPI)                      │
│    Authentication │ Data Aggregation │ Anomaly Scoring          │
└─────────────────────────────┬───────────────────────────────────┘
                              │ Kubernetes Python Client
┌─────────────────────────────┴───────────────────────────────────┐
│              Target Kubernetes Cluster (Read-Only)               │
│        API Server → Nodes │ Pods │ Events │ Metrics             │
└─────────────────────────────────────────────────────────────────┘
```

**Data Flow:**
1. Frontend sends API requests to Backend
2. Backend queries Kubernetes API using Python client
3. Backend processes data and applies anomaly scoring
4. Results returned to Frontend for visualization
5. Operator reviews information and makes decisions

## Technology Stack

### Backend Implementation
- **Python 3.11** - Core programming language
- **FastAPI** - REST API framework
- **Kubernetes Python Client** - Official Python library for K8s API communication
- **scikit-learn** - Machine learning library (Isolation Forest algorithm)
- **NumPy/Pandas** - Data processing and numerical operations
- **WebSocket** - Real-time data streaming to frontend

### Frontend Implementation
- **React 18 with TypeScript** - Type-safe component framework
- **Vite** - Modern build tool and development server
- **TailwindCSS** - Utility-first styling framework
- **Recharts** - Chart visualization library
- **React Query** - Data fetching and caching
- **Zustand** - Lightweight state management
- **Axios** - HTTP client for API communication

### Development Tools
- **Docker** - Containerization for deployment
- **Docker Compose** - Multi-container orchestration
- **kubectl** - Kubernetes CLI for cluster access

## Project Structure

```
k8s-dashboard/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application
│   │   ├── config.py            # Configuration
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── routes/
│   │   │   │   ├── cluster.py   # Cluster endpoints
│   │   │   │   ├── metrics.py   # Metrics endpoints
│   │   │   │   ├── logs.py      # Logs endpoints
│   │   │   │   └── alerts.py    # Alerts endpoints
│   │   ├── services/
│   │   │   ├── kubernetes_service.py
│   │   │   ├── metrics_service.py
│   │   │   ├── logs_service.py
│   │   │   └── anomaly_detector.py
│   │   └── models/
│   │       ├── cluster.py
│   │       ├── metrics.py
│   │       └── alerts.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── App.tsx
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Machine Learning Component: Isolation Forest

### Algorithm Overview

**Classification:** Unsupervised anomaly detection method  
**Purpose:** Highlight unusual metric patterns for operator investigation  
**Library:** scikit-learn implementation

**How It Works:**
1. **Training Phase:** Builds ensemble of isolation trees using historical metrics (CPU%, memory%, restarts)
2. **Detection Phase:** Scores new metric vectors based on average path length in trees
3. **Output:** Anomaly score (negative = unusual, positive = normal) and binary classification

**Key Parameters:**
- `contamination=0.1` - Assumes ~10% of observations are outliers
- `n_estimators=100` - Uses 100 decision trees for scoring

### Important Clarifications

**What Isolation Forest Does:**
- ✓ Identifies metric patterns that differ from historical baseline
- ✓ Provides numerical score indicating degree of unusualness
- ✓ Operates without requiring labeled training data

**What It Does NOT Do:**
- ✗ Predict future failures or resource exhaustion
- ✗ Determine causal relationships between metrics
- ✗ Guarantee detection of all problematic states
- ✗ Eliminate false positives (legitimate workload changes may be flagged)

**Dependencies:**
- Requires minimum 50 historical metric samples for training
- Performance degrades with incomplete or noisy data
- Effectiveness depends on workload stability (highly variable workloads produce more false positives)
- No ground truth available for accuracy validation

**Operator Role:**
Human operators must:
- Review flagged anomalies to determine if action is needed
- Investigate correlated events and logs
- Decide on appropriate remediation steps
- Validate whether alerts represent genuine issues

## Project Scope and Limitations

### Functional Boundaries

**Implemented Features:**
- Read-only access to Kubernetes API (CoreV1Api, AppsV1Api)
- Data aggregation from nodes, pods, deployments, services, events
- Metric collection and time-series visualization
- Unsupervised anomaly scoring using Isolation Forest
- Correlation display of events, metrics, and logs
- Namespace-based filtering and navigation
- JWT-based authentication with role separation

**Explicit Limitations:**
- **No Resource Modification:** System cannot create, update, or delete Kubernetes objects
- **No Automated Remediation:** No pod restarts, scaling operations, or self-healing actions
- **No Causal Analysis:** Displays correlations only; does not determine root causes
- **No Persistence:** All metrics and alerts stored in memory (lost on restart)
- **Single Cluster:** Does not support multi-cluster monitoring
- **No Production Hardening:** Prototype-level security and error handling

### Academic Positioning

This system is a **proof-of-concept prototype** developed for educational purposes. It demonstrates:
- Integration of Kubernetes Python Client with web frameworks
- Application of unsupervised machine learning to infrastructure monitoring
- Design patterns for read-only observability tools

It is **not** a production-ready monitoring platform and should not be described as:
- An autonomous or intelligent system
- A root cause analysis tool (provides correlation support only)
- A replacement for comprehensive monitoring solutions (Prometheus, Grafana, etc.)

### Validation Approach

**For Thesis Defense:**
- Demonstrate functional prototype with live Kubernetes cluster (Minikube/Kind)
- Show anomaly detection on synthetic workload scenarios
- Discuss design decisions, tradeoffs, and limitations explicitly
- Position as learning-focused undergraduate research

**Not Implemented:**
- Comprehensive unit/integration test coverage
- Anomaly detection accuracy evaluation (precision/recall metrics)
- Performance benchmarking or load testing
- User acceptance testing with real operators

## Getting Started

### Prerequisites
- Python 3.11+ (for backend development)
- Node.js 18+ (for frontend development)
- Docker and Docker Compose (for containerized deployment)
- Kubernetes cluster access (Minikube for local testing, or any managed K8s)
- kubectl CLI tool configured with valid kubeconfig

### Quick Start with Docker Compose

```bash
cd k8s-dashboard
docker-compose up --build
```

- Backend API: http://localhost:8000
- Frontend UI: http://localhost:3000
- API Documentation: http://localhost:8000/docs

**Demo Credentials:**
- Admin: `admin` / `admin`
- User: `user` / `user`

### Development Setup

**Backend (Python/FastAPI):**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend (React/TypeScript):**
```bash
cd frontend
npm install
npm run dev
```

### Demo Mode

If no Kubernetes cluster is accessible:
- Backend automatically detects connection failure
- Falls back to simulated demo data
- Allows full UI testing without infrastructure
- Useful for thesis presentation without live cluster

## Deploying Applications to Your Cluster

Once the K8s Dashboard is running, you can deploy and monitor your own containerized applications!

### Quick Deployment Steps

1. **Container your app** with Docker
2. **Push to Docker Hub** or your registry
3. **Create `deployment.yaml`** and `service.yaml` files
4. **Run `kubectl apply`** to deploy
5. **Monitor in K8s Dashboard** in real-time

**See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for complete instructions.**

### Example: Deploy a Coffee Shop App

```bash
# Build and push
docker build -t your-username/coffee-shop:1.0 .
docker push your-username/coffee-shop:1.0

# Deploy to Kubernetes
kubectl apply -f examples/coffee-shop-deployment.yaml

# Monitor in dashboard
# Open http://localhost:3000/user-dashboard
# Go to Workloads → see your coffee shop running!
```

**See example manifests in `examples/` folder:**
- `examples/deployment.yaml` - Template for any app
- `examples/service.yaml` - Template service
- `examples/coffee-shop-deployment.yaml` - Full working example

## API Documentation

Interactive API documentation available at:
- **Swagger UI:** http://localhost:8000/docs (interactive testing)
- **ReDoc:** http://localhost:8000/redoc (readable reference)

**Key Endpoints:**
- `/api/v1/cluster/info` - Kubernetes version and connection status
- `/api/v1/cluster/health` - Cluster health summary with anomaly scores
- `/api/v1/cluster/pods` - Pod listing (filterable by namespace)
- `/api/v1/metrics/current` - Current resource utilization snapshot
- `/api/v1/metrics/detect` - Submit metrics for anomaly scoring
- `/api/v1/logs/pods/{namespace}/{pod}` - Retrieve pod logs

## Thesis Context

**Educational Objectives:**
- Demonstrate full-stack web development skills (React + FastAPI)
- Apply Kubernetes API integration in real-world scenario
- Explore unsupervised machine learning for infrastructure monitoring
- Understand observability challenges in cloud-native systems

**Defense Strategy:**
- Acknowledge limitations proactively
- Focus on learning outcomes and technical challenges overcome
- Position as proof-of-concept, not production system
- Discuss potential improvements and future work

## Contributing

This is an academic project. Feedback and suggestions are welcome for educational purposes.

## License

This project is part of academic research for bachelor graduation thesis.
