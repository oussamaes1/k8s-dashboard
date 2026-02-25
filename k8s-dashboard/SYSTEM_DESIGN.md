# Kubernetes Monitoring Dashboard: System Design Documentation

## Executive Summary

This document provides a detailed technical specification of the Kubernetes Monitoring Dashboard prototype, a bachelor-level research project exploring cluster observability through data aggregation and unsupervised anomaly detection.

**Key Characteristics:**
- **Architecture:** Client-server with external Kubernetes integration
- **Data Flow:** Read-only observation of existing Kubernetes clusters
- **ML Component:** Isolation Forest for unsupervised anomaly scoring
- **Scope:** Educational proof-of-concept, not production system

---

## 1. System Overview and Objectives

### 1.1 Educational Purpose

This system demonstrates:
1. Integration of Kubernetes Python Client with modern web frameworks
2. Design patterns for read-only observability tools
3. Application of unsupervised machine learning to infrastructure data
4. Full-stack development with React + FastAPI + TypeScript

### 1.2 Design Principles

**1. Non-Invasiveness:** System must not modify target cluster
- No deployments, scaling, or resource management
- Read-only Kubernetes API operations only
- External architecture (no in-cluster components)

**2. Decision Support, Not Autonomy:** Operator remains in control
- System highlights unusual patterns, does not make decisions
- Correlation-based analysis, not causal inference
- All actions remain under human responsibility

**3. Transparency:** Explicitly acknowledge limitations
- No claims of "AI-powered" or "automatic" features
- Isolation Forest presented as unsupervised scoring method
- Anomaly detection accuracy not guaranteed

**4. Academic Rigor:** Suitable for thesis defense
- Conservative technical claims
- Clear scope boundaries
- Honest discussion of limitations

---

## 2. Architecture Design

### 2.1 Overall Structure

```
┌────────────────────────────────────────────────┐
│        Frontend (React + TypeScript)            │
│  Browser-based UI with charts and tables       │
└─────────────────┬──────────────────────────────┘
                  │
                  │ HTTP/REST API
                  │
┌─────────────────┴──────────────────────────────┐
│      Backend (Python/FastAPI)                   │
│  API Server, data processing, ML component     │
└─────────────────┬──────────────────────────────┘
                  │
                  │ Kubernetes Python Client
                  │ (kubeconfig authentication)
                  │
┌─────────────────┴──────────────────────────────┐
│   Target Kubernetes Cluster (READ-ONLY)         │
│  CoreV1 API: Nodes, Pods, Events, Services     │
└─────────────────────────────────────────────────┘
```

### 2.2 Component Responsibilities

#### Frontend Component

**Responsibility:** Present data to operators in accessible, actionable format

**Capabilities:**
- HTTP requests to backend API
- Real-time chart updates via React Query auto-refetch
- WebSocket connections for live metrics (optional feature)
- User authentication with JWT token management
- Namespace and resource filtering

**Limitations:**
- Client-side log search only (no full-text backend indexing)
- No historical data persistence in browser storage
- Limited to single backend instance (no load balancing)

#### Backend Component

**Responsibility:** Aggregate Kubernetes data, apply anomaly scoring, serve API

**Capabilities:**
- Kubernetes API client initialization and connection management
- Metric aggregation and calculation
- Unsupervised anomaly scoring via Isolation Forest
- JWT authentication and role-based access control
- Event correlation (matching events to metric anomalies)
- Error handling and graceful degradation (demo mode)

**Limitations:**
- Single-instance architecture (no clustering)
- In-memory data storage (volatile on restart)
- No persistent historical database
- No alerting pipeline (email, Slack, etc.)

#### Kubernetes Python Client Integration

**Responsibility:** Communicate with target cluster via official Python client

**API Groups Used:**
- `CoreV1Api` - Nodes, Pods, Services, Events
- `AppsV1Api` - Deployments, ReplicaSets, StatefulSets
- `CustomObjectsApi` - Custom metrics from metrics-server

**Connection Modes:**
1. **In-Cluster Mode** (when running inside K8s): Uses service account
2. **External Mode** (local development): Uses kubeconfig file at `~/.kube/config`

---

## 3. Backend Design

### 3.1 FastAPI Application Structure

**Main Entry Point:** `app/main.py`

```python
# Simplified structure
app = FastAPI()

# Lifespan events: initialize services on startup
@asynccontextmanager
async def lifespan(app):
    k8s_service = KubernetesService()
    anomaly_detector = AnomalyDetector()
    app.state.k8s_service = k8s_service
    app.state.anomaly_detector = anomaly_detector
    yield
    # Cleanup on shutdown

# Route registration
app.include_router(auth.router, prefix="/api/v1/auth")
app.include_router(cluster.router, prefix="/api/v1/cluster")
app.include_router(metrics.router, prefix="/api/v1/metrics")
app.include_router(logs.router, prefix="/api/v1/logs")
app.include_router(alerts.router, prefix="/api/v1/alerts")
```

**CORS Configuration:** 
- Allows requests from localhost ports 3000-3003, 5173
- Configurable via environment variables for different deployment contexts

### 3.2 Authentication and Authorization

**JWT Token Implementation:**

```
Login Flow:
┌────────┐
│ User   │ ──POST /auth/login──> ┌────────┐
│        │                        │Backend │
│        │ <──{token, role}───── │        │
└────────┘                        └────────┘

Subsequent Requests:
┌────────┐
│ User   │ ──GET /cluster/info───> ┌────────┐
│        │  + Authorization header │Backend │
│        │ <──200 OK with data──── │        │
└────────┘                          └────────┘
```

**Key Details:**
- Algorithm: HS256 (HMAC with SHA-256)
- Expiration: 480 minutes (8 hours)
- Secret: Currently hardcoded in code (not secure for production)
- Roles: `admin` (full access), `user` (read-only)

**Role-Based Access Control (RBAC):**

| Endpoint | Admin | User | Notes |
|----------|-------|------|-------|
| GET /cluster/* | ✓ | ✓ | Read cluster state |
| GET /metrics/* | ✓ | ✓ | View metrics |
| GET /logs/* | ✓ | ✓ | View pod logs |
| GET /alerts* | ✓ | ✗ | Admin-only alerts |
| POST /alerts/acknowledge | ✓ | ✗ | Alert management |

### 3.3 Kubernetes Service Module

**File:** `app/services/kubernetes_service.py`

**Core Methods:**

```python
class KubernetesService:
    
    def get_cluster_info() -> Dict:
        """Return K8s version, platform, connection status"""
        
    def get_nodes() -> List[Dict]:
        """Node inventory with capacity and conditions"""
        return [{
            "name": "node-1",
            "status": "Ready",
            "cpu_capacity": "4",
            "memory_capacity": "8Gi",
            "pod_count": 12,
            "conditions": [...]
        }]
    
    def get_pods(namespace: str) -> List[Dict]:
        """Pods in namespace with status and restarts"""
        return [{
            "name": "nginx-xyz",
            "namespace": "default",
            "status": "Running",
            "restarts": 0,
            "containers": [...]
        }]
    
    def get_events(namespace: str, limit: int) -> List[Dict]:
        """Recent Kubernetes events"""
        return [{
            "type": "Warning|Normal",
            "reason": "Failed|CrashLoopBackOff",
            "message": "...",
            "timestamp": "2026-02-05T10:00:00Z"
        }]
```

**Error Handling Strategy:**

1. **Connected Mode:** Queries live Kubernetes API
2. **Fallback Mode:** If API unreachable, returns demo data
3. **Demo Mode:** Generates synthetic data for testing without cluster

### 3.4 Anomaly Detection Service

**File:** `app/services/anomaly_detector.py`

**Isolation Forest Implementation:**

```
Training Phase:
┌─────────────────────────────────────────┐
│ Historical metric samples (50+ points)  │
│ {cpu%, memory%, restarts, ...}          │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ StandardScaler Normalization            │
│ (zero mean, unit variance)              │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ IsolationForest (n_estimators=100)      │
│ Build 100 random decision trees         │
└────────────────┬────────────────────────┘
                 │
                 ▼
        Trained Model Ready
        
Detection Phase:
┌─────────────────────────────────────────┐
│ New metric vector {cpu: 85, mem: 92, ...}
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ Traverse all 100 trees                  │
│ Calculate path length for isolation     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ decision_function() -> score             │
│ (-inf, 0] = normal, [0, +inf) = anomaly │
└────────────────┬────────────────────────┘
                 │
                 ▼
        Return (is_anomaly, score, details)
```

**Anomaly Scoring Details:**

- **Score Range:** Unbounded (typically -1 to +1)
- **Threshold:** Fixed at -0.5 (configurable)
- **Interpretation:** More negative = more anomalous
- **Normalized Score:** Output 0-1 for display: `max(0, min(1, (threshold - score) / |threshold|))`

**Contributing Factor Identification:**

For flagged anomalies, system calculates z-scores for each metric:

```
z_score(metric) = (current_value - mean) / std_dev

If |z_score| > 2:  Contributing factor identified
If |z_score| > 3:  High severity contribution
```

**Important Notes:**
- Z-score calculation based on recent historical data (~100 samples)
- Is heuristic, not derived from model internals
- Helps operators understand *which* metrics were unusual
- Does NOT explain *why* they were unusual

### 3.5 API Route Endpoints

#### Cluster Routes: `/api/v1/cluster`

| Method | Path | Returns | Notes |
|--------|------|---------|-------|
| GET | `/info` | Cluster version, platform | Connection status |
| GET | `/health` | Anomaly count, warning count, health status | Aggregated view |
| GET | `/nodes` | Node list with capacity | Inventory |
| GET | `/nodes/{name}` | Specific node details | Single node |
| GET | `/namespaces` | Available namespaces | For filtering |
| GET | `/pods` | Pods in namespace | Filterable by namespace |
| GET | `/pods/{namespace}/{name}` | Pod details, containers, logs reference | Single pod |
| GET | `/events` | Warning/Error events | Recent cluster events |

#### Metrics Routes: `/api/v1/metrics`

| Method | Path | Returns | Notes |
|--------|------|---------|-------|
| GET | `/current` | CPU%, Memory%, aggregate | Snapshot |
| POST | `/detect` | Anomaly score, factors | Scoring endpoint |
| GET | `/anomalies` | Recent flagged anomalies | History |
| GET | `/history` | Time-series metric data | Charts |

#### Logs Routes: `/api/v1/logs`

| Method | Path | Returns | Notes |
|--------|------|---------|-------|
| GET | `/pods/{namespace}/{pod}` | Container logs | Tail last N lines |
| GET | `/search` | Matching log lines | Text search |

#### Alerts Routes: `/api/v1/alerts`

| Method | Path | Returns | Notes |
|--------|------|---------|-------|
| GET | `/` | Active alerts, filtered | Status/severity filters |
| GET | `/active` | Alert summary | Count by severity |
| POST | `/acknowledge` | Updated alert | Admin only |

#### Authentication Routes: `/api/v1/auth`

| Method | Path | Payload | Returns |
|--------|------|---------|---------|
| POST | `/login` | username, password | JWT token, user info |
| POST | `/signup` | username, email, password | Account created |
| GET | `/me` | (requires token) | Current user info |

---

## 4. Frontend Design

### 4.1 React Component Hierarchy

```
App.tsx (Main Router)
├── Login.tsx (Public route)
├── Signup.tsx (Public route)
└── Layout (Protected, requires token)
    ├── ClusterStatus (Connection indicator)
    ├── NamespaceSelector (Dropdown)
    ├── NavigationSidebar
    └── Main Content Area
        ├── ClusterOverview.tsx
        │   ├── Health Status Card
        │   ├── Node Summary Cards
        │   ├── Pod Summary Cards
        │   └── Recent Events
        ├── Workloads.tsx
        │   ├── Deployments Table
        │   └── Pods Table
        ├── Metrics.tsx
        │   ├── CPU Usage Chart
        │   ├── Memory Usage Chart
        │   └── Time Range Selector
        ├── Logs.tsx
        │   ├── Pod/Container Selector
        │   └── Log Viewer
        ├── RootCauseAnalysis.tsx
        │   ├── Anomalies Section
        │   ├── Contributing Factors
        │   └── Related Events
        └── Alerts.tsx
            ├── Alert Rules List
            └── Active Alerts Table
```

### 4.2 State Management (Zustand)

**Global Store:** `src/store/index.ts`

```typescript
interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (username, password) => Promise<void>
  logout: () => void
}

interface ClusterState {
  selectedNamespace: string
  availableNamespaces: string[]
  setSelectedNamespace: (ns: string) => void
  fetchAvailableNamespaces: () => Promise<void>
}
```

**Persistence:** 
- Authentication token persisted in localStorage
- Namespace selection persisted and synced with backend

### 4.3 Data Fetching with React Query

**Setup:** `src/services/api.ts`

```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1'
})

// Cluster endpoints
clusterApi = {
  getInfo: () => api.get('/cluster/info'),
  getHealth: () => api.get('/cluster/health'),
  getPods: (namespace) => api.get('/cluster/pods', { params: { namespace } }),
  // ... other endpoints
}

// Usage in components
const { data: health, isLoading } = useQuery({
  queryKey: ['cluster-health'],
  queryFn: () => clusterApi.getHealth().then(res => res.data),
  refetchInterval: 15000,  // Auto-refresh every 15 seconds
})
```

**Key Features:**
- Automatic caching of API responses
- Background refetching at configured intervals
- Stale data handling (shows old data while fetching new)
- Error boundary integration

### 4.4 Visualization

**Metrics Charts:** Recharts library

```typescript
<LineChart data={historicalData}>
  <CartesianGrid />
  <XAxis dataKey="timestamp" />
  <YAxis yAxisId="left" label={{ value: 'CPU %', angle: -90 }} />
  <YAxis yAxisId="right" orientation="right" />
  <Tooltip />
  <Legend />
  <Line yAxisId="left" type="monotone" dataKey="cpu" stroke="#8884d8" />
  <Line yAxisId="right" type="monotone" dataKey="memory" stroke="#82ca9d" />
</LineChart>
```

**Status Indicators:**

```typescript
// Health status color coding
const getHealthColor = (status: string) => {
  switch(status) {
    case 'Healthy': return 'green-400'
    case 'Warning': return 'yellow-400'
    case 'Critical': return 'red-400'
  }
}
```

---

## 5. Machine Learning Module: Detailed Specification

### 5.1 Isolation Forest Algorithm

**Theoretical Foundation:**

The Isolation Forest algorithm detects anomalies through the principle of "isolation." In an ensemble of random binary trees:
- Normal points require many splits to isolate
- Anomalous points are isolated quickly due to being few and different

**Implementation:**

```python
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

# Initialization
self.model = IsolationForest(
    contamination=0.1,      # Expect ~10% outliers
    n_estimators=100,       # 100 trees
    max_samples='auto',     # n_samples or 256
    random_state=42,        # Reproducibility
    n_jobs=-1              # Parallel processing
)

self.scaler = StandardScaler()

# Training
X_scaled = scaler.fit_transform(X)  # Shape: (n_samples, n_features)
model.fit(X_scaled)

# Prediction
scores = model.decision_function(X_scaled)  # Raw anomaly scores
predictions = model.predict(X_scaled)        # -1 (anomaly) or 1 (normal)
```

**Output Interpretation:**

- **decision_function() output:**
  - Negative values → Anomalous
  - Positive values → Normal
  - More negative → More anomalous
  - Range typically [-1, 1] depending on data

- **predict() output:**
  - `-1` → Flagged as anomaly
  - `1` → Normal point

**Mathematical Details:**

Anomaly score formula: $s(x) = 2^{-\frac{h(x)}{c(n)}}$

Where:
- $h(x)$ = average path length in trees
- $c(n)$ = expected path length in unsuccessful BST search

### 5.2 Feature Engineering

**Raw Features** (extracted from Kubernetes API):

| Feature | Source | Range | Unit |
|---------|--------|-------|------|
| `cpu_percent` | Node/Pod metrics | 0-100 | Percentage |
| `memory_percent` | Node/Pod metrics | 0-100 | Percentage |
| `pod_restarts` | Pod status | 0-∞ | Count |
| `failed_pods` | Namespace status | 0-∞ | Count |
| `disk_pressure` | Node conditions | 0-100 | Score |
| `network_errors` | Node metrics | 0-∞ | Count |

**Preprocessing Pipeline:**

1. **Collection:** Query metrics from Kubernetes API every 15 seconds
2. **Validation:** Handle missing values (substitute 0)
3. **Normalization:** StandardScaler (μ=0, σ=1) per feature
4. **Storage:** Keep last 1000 samples in circular buffer

**Missing Value Handling:**
```python
# If metric unavailable
X = np.array([[m.get('cpu_percent', 0),
               m.get('memory_percent', 0),
               ...]])
```

### 5.3 Training Strategy

**Minimum Data Requirements:**
- `train()` requires ≥50 historical samples
- With <50 samples, returns False and operates in demo mode
- At 15-second intervals, reaches 50 samples in ~12 minutes

**Training Process:**

```python
def train(self, metrics_data: List[Dict]) -> bool:
    if len(metrics_data) < 50:
        return False  # Not enough data
    
    # Extract feature matrix
    features = ['cpu_percent', 'memory_percent', 'pod_restarts', ...]
    X = np.array([[m.get(f, 0) for f in features] for m in metrics_data])
    
    # Normalize
    X_scaled = self.scaler.fit_transform(X)
    
    # Train model
    self.model.fit(X_scaled)
    self._is_trained = True
    
    return True
```

**Model Persistence:**
- Model **NOT** persisted to disk
- Retraining required on application restart
- Training data not persistent (lost on restart)

### 5.4 Detection Process

**Runtime Scoring:**

```
New Metric Vector Arrives
    │
    ├─→ Validate has required features
    │
    ├─→ Standardize using fitted scaler
    │
    ├─→ Pass through trained model
    │
    ├─→ Compute anomaly score
    │
    ├─→ Compare to threshold (-0.5)
    │
    └─→ Return (is_anomaly, score, contributing_factors)
```

**Contributing Factors:**

When anomaly detected, system identifies unusual metrics via z-scores:

```python
def _identify_anomaly_factors(self, metrics: Dict) -> List[Dict]:
    factors = []
    for feature in feature_names:
        values = [h.get(feature) for h in recent_history]
        
        mean = np.mean(values)
        std = np.std(values)
        
        z_score = (current_value - mean) / std
        
        if abs(z_score) > 2:  # >2 std from mean
            factors.append({
                'feature': feature,
                'z_score': z_score,
                'current': current_value,
                'mean': mean,
                'severity': 'high' if abs(z_score) > 3 else 'medium'
            })
    
    return factors
```

### 5.5 Limitations and Assumptions

**Key Assumptions:**

1. **Data Distribution:** Historical data represents normal behavior
   - System cannot detect novel types of anomalies
   - Requires sufficient baseline of typical workload patterns

2. **Feature Independence:** Treats features as independent
   - May miss complex interdependencies
   - Example: High CPU + High Memory correlation missed

3. **Static Threshold:** Fixed contamination rate (10%)
   - Assumes ~10% of future observations are anomalous
   - May not match actual anomaly rate of workload

4. **No Temporal Awareness:** Treats metrics as IID (independent, identically distributed)
   - Cannot detect gradual trends (resource leak)
   - Cannot detect seasonal patterns (daily peak load)

**Failure Modes:**

| Scenario | Model Output | Operator Impact |
|----------|--------------|-----------------|
| New workload deployment | Many anomalies | False positives until model learns |
| Workload scaling event | Anomalies flagged | Legitimate scale ops marked anomalous |
| Cluster stress test | High anomaly score | Cannot distinguish test from failure |
| Noisy metrics | Erratic anomaly scores | Reduced reliability |

**Validation Gaps:**

- **No ground truth:** Cannot compute precision/recall without labeled anomaly dataset
- **No accuracy metrics:** Cannot quantify detection performance
- **No benchmark:** Cannot compare to alternative methods
- **Operator validation only:** Relies on manual review for correctness

### 5.6 Alternative Methods Not Implemented

For reference, other approaches exist:

| Method | Pros | Cons | Why Not Used |
|--------|------|------|--------------|
| Statistical (Z-score) | Simple, interpretable | Assumes normal distribution | Chosen for prototype: simpler baseline |
| Density-based (DBSCAN) | Captures clusters | Requires distance metric | Higher complexity |
| Time-series (ARIMA) | Handles trends | Needs more data, complex | Beyond thesis scope |
| Deep Learning (LSTM) | High capacity | Requires much more data | Overkill for prototype |

---

## 6. Data Flow and Request Lifecycle

### 6.1 Example: Cluster Health Check

```
1. Frontend Component Mounts
   └─→ useQuery('cluster-health')
   
2. React Query Triggers HTTP Request
   └─→ GET /api/v1/cluster/health
   
3. FastAPI Endpoint Handler
   ├─→ Extract k8s_service from app.state
   ├─→ Extract anomaly_detector from app.state
   └─→ Call cluster_health logic:
   
4. Cluster Health Logic
   ├─→ k8s_service.get_nodes() → Query CoreV1Api
   ├─→ k8s_service.get_pods() → Query CoreV1Api
   ├─→ k8s_service.get_events() → Query CoreV1Api
   └─→ Return aggregated data
   
5. Anomaly Detector Scoring
   ├─→ Extract metrics from nodes/pods
   ├─→ Create feature vector
   ├─→ Score via trained model
   ├─→ Count anomalies
   └─→ Compile health response
   
6. Response Construction
   ├─→ Aggregate statistics
   ├─→ Format anomalies list
   ├─→ Serialize to JSON
   └─→ Return HTTP 200
   
7. Frontend Processing
   ├─→ Parse JSON response
   ├─→ Update React state
   ├─→ Trigger component re-render
   └─→ User sees updated health status
```

**Timeline:** ~500-1000ms (depends on cluster size and network)

### 6.2 Example: Anomaly Detection on New Metrics

```
1. Metrics Collection Timer (every 15 seconds)
   └─→ Backend queries node/pod metrics
   
2. Feature Extraction
   ├─→ cpu_percent, memory_percent, restarts
   ├─→ Create vector: [85, 72, 2]
   └─→ Store in metrics_history
   
3. Model Check
   ├─→ Is model trained? Yes
   ├─→ Do we have ≥50 samples? Yes
   └─→ Proceed to scoring
   
4. Normalization
   ├─→ Apply StandardScaler transformation
   ├─→ Output: scaled vector
   └─→ Shape: (1, n_features)
   
5. Isolation Forest Scoring
   ├─→ Traverse all 100 trees
   ├─→ Calculate path length
   ├─→ Compute decision_function()
   └─→ Return score: -0.8 (anomalous)
   
6. Threshold Comparison
   ├─→ Score (-0.8) < Threshold (-0.5)? Yes
   ├─→ Classification: ANOMALY
   └─→ is_anomaly = True
   
7. Contributing Factors
   ├─→ Calculate z-scores for each metric
   ├─→ cpu_percent: z=2.5 (high)
   ├─→ memory_percent: z=0.8 (normal)
   ├─→ restarts: z=1.2 (normal)
   └─→ Identify cpu_percent as primary factor
   
8. Storage
   ├─→ Add to anomaly_history (circular buffer)
   ├─→ Keep last 100 anomalies
   └─→ Lost on application restart
```

---

## 7. Deployment Architecture

### 7.1 Docker Containerization

**Backend Container:**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend Container:**

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json .
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 7.2 Docker Compose Orchestration

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    container_name: k8s-dashboard-backend
    ports:
      - "8000:8000"
    environment:
      - K8S_IN_CLUSTER=false
      - DEBUG=true
      - LOG_LEVEL=INFO
    volumes:
      - ~/.kube:/root/.kube:ro  # Mount kubeconfig
    networks:
      - k8s-dashboard

  frontend:
    build: ./frontend
    container_name: k8s-dashboard-frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - k8s-dashboard

networks:
  k8s-dashboard:
    driver: bridge
```

### 7.3 Deployment Modes

**Local Development (Docker Compose):**
- Backend: http://localhost:8000
- Frontend: http://localhost:3000
- kubeconfig: ~/.kube/config (mounted volume)

**Kubernetes Cluster Deployment (Optional):**
- Deploy backend/frontend as K8s Deployments
- Mount kubeconfig as Secret
- Use Service to expose frontend

---

## 8. Security Considerations

### 8.1 Current Implementation (Prototype Level)

**Authentication:**
- JWT tokens (HS256)
- Secret key hardcoded (NOT SECURE)
- No HTTPS enforcement

**Authorization:**
- Role-based access control (admin/user)
- Enforced at route level

**Data Handling:**
- Kubeconfig mounted as file (not secure)
- No encryption of sensitive data in transit (development only)
- In-memory storage of metrics (volatile)

### 8.2 Production Hardening Required

For production deployment (NOT in scope for thesis):

1. **Secret Management:**
   - Use environment variables or secret managers
   - Rotate JWT secrets
   - Never hardcode credentials

2. **Network Security:**
   - Enforce HTTPS/TLS
   - API rate limiting
   - Request validation

3. **Access Control:**
   - Integrate with cloud IAM (AWS, GCP, Azure)
   - Fine-grained RBAC
   - Audit logging

4. **Data Protection:**
   - Encrypt secrets in transit
   - Use secure credential mounting
   - Implement data retention policies

---

## 9. Testing and Validation

### 9.1 Manual Testing Approach

**Functional Testing:**
- Login with demo credentials
- View cluster overview
- Trigger anomaly detection (induce high CPU pod)
- Verify correlation display

**Integration Testing:**
- Backend connects to Minikube cluster
- Queries return expected data
- Fallback to demo mode on connection failure

**UI Testing:**
- Charts render correctly
- Tables paginate and filter
- Real-time updates work

### 9.2 Demo Mode Testing

Without Kubernetes access:
- Backend detects failed connection
- Automatically provides simulated data
- Full UI functionality testable offline

### 9.3 Not Implemented

For thesis scope purposes, these are NOT implemented:
- Unit tests (edge case coverage)
- Performance/load testing
- Security testing (penetration testing)
- Anomaly detection validation (precision/recall)
- User acceptance testing

---

## 10. Limitations Summary

### Scope Boundaries

**Explicitly NOT Included:**
- ✗ Kubernetes resource modification (deployments, scaling)
- ✗ Automated remediation or self-healing
- ✗ Multi-cluster support
- ✗ Historical data persistence
- ✗ High availability or failover
- ✗ Production-grade security
- ✗ Comprehensive monitoring suite

**Explicitly Included:**
- ✓ Read-only cluster observation
- ✓ Data aggregation and visualization
- ✓ Unsupervised anomaly scoring
- ✓ Event-metric correlation
- ✓ Basic RBAC
- ✓ Demo mode for offline testing

---

## 11. Future Work

Potential enhancements beyond thesis scope:

1. **Data Persistence:**
   - PostgreSQL backend for historical metrics
   - Time-series database (InfluxDB, TimescaleDB)
   - Trend analysis and forecasting

2. **Advanced Anomaly Detection:**
   - Multivariate statistical methods
   - Time-series models (ARIMA, Prophet)
   - Deep learning (LSTM autoencoders)

3. **Operational Features:**
   - Alerting pipelines (Slack, email, PagerDuty)
   - Custom alert rules
   - Playbook automation
   - Multi-cluster federation

4. **ML Improvements:**
   - Model validation and metrics
   - Adaptive thresholds
   - Feedback loop for false positive reduction
   - Labeled anomaly dataset collection

5. **Production Deployment:**
   - Kubernetes Helm charts
   - High availability architecture
   - RBAC integration with cloud IAM
   - Comprehensive audit logging

---

## 12. Conclusion

This system design document specifies a research-focused prototype demonstrating cluster observability principles. The architecture prioritizes educational clarity and maintainability over production scale and features.

Key design decisions:
- **Non-invasive observation** ensures safety
- **Read-only operations** maintain cluster integrity
- **Unsupervised learning** avoids labeling burden
- **Graceful degradation** enables offline testing
- **Explicit limitations** support academic credibility

The system achieves its educational objectives while maintaining realistic scope for bachelor-level research.

---

**Document Version:** 1.0  
**Last Updated:** February 2026  
**Author:** OUSSAMA ESSABTI  
**Advisor:** Lai Xinfeng
