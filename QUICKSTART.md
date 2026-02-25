# Multi-Cluster Kubernetes Dashboard - Quick Start

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.8+
- Node.js 16+
- Kubernetes cluster access (optional for demo mode)

### Step 1: Backend Setup

```powershell
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Set encryption key (required for credential security)
$env:ENCRYPTION_KEY = python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Initialize database and create admin user
python init_db.py

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: http://localhost:8000

### Step 2: Frontend Setup

```powershell
# Navigate to frontend directory (in new terminal)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: http://localhost:5173

### Step 3: Login and Add Cluster

1. Open browser: http://localhost:5173
2. Login with default credentials:
   - **Username**: `admin`
   - **Password**: `admin`
3. Navigate to "Cluster Management"
4. Click "Add Cluster"
5. Choose method:
   - **Kubeconfig**: Upload your `~/.kube/config` file
   - **API Token**: Enter API server URL + bearer token
6. Test connection and start monitoring!

## 🔐 Default Credentials

| Username | Password | Role  |
|----------|----------|-------|
| admin    | admin    | admin |

**⚠️ IMPORTANT**: Change these credentials immediately in production!

## 📁 Project Structure

```
k8s-dashboard/
├── backend/
│   ├── app/
│   │   ├── api/routes/
│   │   │   ├── auth.py          # Authentication
│   │   │   ├── clusters.py      # Multi-cluster management
│   │   │   ├── cluster.py       # Legacy cluster routes
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── cluster_manager.py    # Cluster management service
│   │   │   ├── kubernetes_service.py # K8s API client
│   │   │   ├── audit_service.py      # Audit logging
│   │   │   └── anomaly_detector.py   # ML anomaly detection
│   │   ├── utils/
│   │   │   └── security.py      # Encryption utilities
│   │   ├── database.py          # Database models
│   │   ├── middleware.py        # User isolation middleware
│   │   ├── config.py           # Configuration
│   │   └── main.py             # FastAPI application
│   ├── init_db.py              # Database initialization
│   └── requirements.txt        # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ClusterSwitcher.tsx    # NEW: Cluster selector
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── ClusterManagement.tsx  # NEW: Cluster management UI
│   │   │   └── ...
│   │   ├── services/
│   │   │   └── api.ts          # API client (updated)
│   │   ├── store/
│   │   │   └── index.ts        # State management (updated)
│   │   └── App.tsx             # Main app (updated)
│   └── package.json
└── MULTI_CLUSTER_ARCHITECTURE.md  # Complete documentation
```

## 🎯 Key Features Implemented

### ✅ Multi-User Support
- Each user has their own account
- User isolation at database level
- Role-based access control (Admin/User)

### ✅ Multi-Cluster Support
- Users can add unlimited clusters
- Two authentication methods: kubeconfig or API token
- Cluster switcher dropdown in UI
- Per-cluster configuration

### ✅ Security
- **Encrypted Credentials**: All kubeconfig files and tokens stored encrypted
- **User Isolation**: Users can only access their own clusters
- **Audit Logging**: All actions logged with user, timestamp, and IP
- **Namespace RBAC**: Optional per-cluster namespace restrictions

### ✅ Credential Management
- Upload kubeconfig files
- Enter API server URL + token manually
- Secure storage with Fernet encryption
- Credentials never exposed to frontend

### ✅ Cluster Management UI
- Add/delete clusters
- Test cluster connections
- View cluster status
- Configure namespace restrictions

### ✅ Audit Trail
- Complete action logging
- Track pod deletions, scaling, etc.
- User activity dashboard
- Security compliance

## 🔧 Configuration

### Environment Variables

```powershell
# Required for production
$env:ENCRYPTION_KEY = "your-base64-encryption-key"
$env:DATABASE_URL = "postgresql://user:pass@localhost/k8s_dashboard"
$env:SECRET_KEY = "your-jwt-secret-key"

# Optional
$env:DEBUG = "False"
$env:LOG_LEVEL = "INFO"
```

### Generate Secure Keys

```powershell
# Encryption key for credentials
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# JWT secret key
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## 📊 Database

### Development (SQLite)
Automatically created at: `backend/k8s_dashboard.db`

### Production (PostgreSQL)
```powershell
# Install PostgreSQL
# Create database
createdb k8s_dashboard

# Set environment variable
$env:DATABASE_URL = "postgresql://user:pass@localhost/k8s_dashboard"

# Initialize
python init_db.py
```

## 🧪 Testing

### Test Encryption
```powershell
cd backend
python -m app.utils.security
```

### Test API
```powershell
# Get clusters
curl http://localhost:8000/api/v1/clusters -H "Authorization: Bearer YOUR_TOKEN"

# Test connection
curl -X POST http://localhost:8000/api/v1/clusters/1/test -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Frontend
```powershell
cd frontend
npm run build
npm run preview
```

## 📚 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/signup` - User registration
- `GET /api/v1/auth/me` - Get current user

### Cluster Management
- `GET /api/v1/clusters` - List user's clusters
- `POST /api/v1/clusters` - Add cluster (kubeconfig)
- `POST /api/v1/clusters/token` - Add cluster (token)
- `POST /api/v1/clusters/upload-kubeconfig` - Upload kubeconfig file
- `GET /api/v1/clusters/{id}` - Get cluster details
- `PUT /api/v1/clusters/{id}` - Update cluster
- `DELETE /api/v1/clusters/{id}` - Delete cluster
- `POST /api/v1/clusters/{id}/test` - Test connection

### Cluster Operations (per-cluster)
- All existing endpoints now accept `?cluster_id=X` parameter
- Example: `GET /api/v1/cluster/pods?cluster_id=1`

Full API docs: http://localhost:8000/docs

## 🐛 Troubleshooting

### Backend won't start
```powershell
# Check Python version
python --version  # Should be 3.8+

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Initialize database
python init_db.py
```

### Frontend won't start
```powershell
# Check Node version
node --version  # Should be 16+

# Clear cache and reinstall
Remove-Item -Path node_modules -Recurse -Force
Remove-Item package-lock.json
npm install
```

### "ENCRYPTION_KEY not set" error
```powershell
# Generate and set encryption key
$key = python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
$env:ENCRYPTION_KEY = $key
```

### "Cluster not found" error
- Verify cluster belongs to logged-in user
- Check cluster is active in database
- Test cluster connection from UI

### Database errors
```powershell
# Reset database (WARNING: deletes all data)
Remove-Item backend/k8s_dashboard.db
python backend/init_db.py
```

## 📖 Documentation

- **Complete Guide**: [MULTI_CLUSTER_ARCHITECTURE.md](./MULTI_CLUSTER_ARCHITECTURE.md)
- **API Docs**: http://localhost:8000/docs
- **System Design**: [SYSTEM_DESIGN.md](./k8s-dashboard/SYSTEM_DESIGN.md)

## 🎓 For Thesis Defense

This implementation demonstrates:
1. **Multi-tenancy**: Complete user isolation
2. **Security**: Encrypted credentials, audit logging
3. **Scalability**: Support for unlimited users and clusters
4. **Production-ready**: Error handling, validation, testing
5. **Modern Architecture**: Microservices, REST API, React SPA

## 📝 Next Steps

1. ✅ System is production-ready
2. 🔐 Change default admin password
3. 🔑 Store encryption key securely (vault, KMS)
4. 🗄️ Migrate to PostgreSQL for production
5. 🔒 Enable HTTPS/TLS
6. 📊 Set up monitoring and alerting
7. 🔄 Implement backup strategy

## 🤝 Support

For issues or questions:
1. Check [MULTI_CLUSTER_ARCHITECTURE.md](./MULTI_CLUSTER_ARCHITECTURE.md)
2. Review API docs at `/docs`
3. Check console logs for errors

---

**Status**: ✅ Production Ready
**Last Updated**: February 17, 2026
**Version**: 2.0.0 - Multi-Cluster Edition
