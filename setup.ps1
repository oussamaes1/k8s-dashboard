# Multi-User, Multi-Cluster Kubernetes Dashboard
# Quick Start Script for Windows PowerShell

Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host "    Kubernetes Dashboard - Multi-Cluster Edition" -ForegroundColor Green
Write-Host "    Quick Start Script" -ForegroundColor Green
Write-Host ("=" * 71) -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "[OK] Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Python not found. Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js not found. Please install Node.js 16+" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host "Step 1: Backend Setup" -ForegroundColor Yellow
Write-Host ("=" * 71) -ForegroundColor Cyan

# Navigate to backend
Set-Location -Path "k8s-dashboard\backend"

# Check if venv exists
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1

# Install dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt -q

# Generate encryption key if not set
if (-not $env:ENCRYPTION_KEY) {
    Write-Host "Generating encryption key..." -ForegroundColor Yellow
    $env:ENCRYPTION_KEY = python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    Write-Host "[OK] Encryption key generated" -ForegroundColor Green
    Write-Host "    IMPORTANT: Save this key for future use:" -ForegroundColor Magenta
    Write-Host "    $env:ENCRYPTION_KEY" -ForegroundColor Cyan
}

# Initialize database
Write-Host "Initializing database..." -ForegroundColor Yellow
python init_db.py

Write-Host ""
Write-Host "[SUCCESS] Backend setup complete!" -ForegroundColor Green
Write-Host ""

# Return to root
Set-Location -Path "..\..\"

Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host "Step 2: Frontend Setup" -ForegroundColor Yellow
Write-Host ("=" * 71) -ForegroundColor Cyan

# Navigate to frontend
Set-Location -Path "k8s-dashboard\frontend"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm dependencies (this may take a few minutes)..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "[OK] npm dependencies already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "[SUCCESS] Frontend setup complete!" -ForegroundColor Green

# Return to root
Set-Location -Path "..\..\"

Write-Host ""
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host ("=" * 71) -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Start Backend (in this terminal):" -ForegroundColor White
Write-Host "   cd k8s-dashboard\backend" -ForegroundColor Cyan
Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor Cyan
Write-Host "   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Start Frontend (in NEW terminal):" -ForegroundColor White
Write-Host "   cd k8s-dashboard\frontend" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Open Browser:" -ForegroundColor White
Write-Host "   http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Login:" -ForegroundColor White
Write-Host "   Username: admin" -ForegroundColor Cyan
Write-Host "   Password: admin" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Add Your First Cluster:" -ForegroundColor White
Write-Host "   Navigate to 'Cluster Management'" -ForegroundColor Cyan
Write-Host "   Click 'Add Cluster'" -ForegroundColor Cyan
Write-Host "   Upload your kubeconfig or enter API server + token" -ForegroundColor Cyan
Write-Host ""
Write-Host "[!] IMPORTANT: Change the admin password in production!" -ForegroundColor Magenta
Write-Host ""
Write-Host "For detailed documentation, see:" -ForegroundColor White
Write-Host "  - QUICKSTART.md" -ForegroundColor Cyan
Write-Host "  - k8s-dashboard\MULTI_CLUSTER_ARCHITECTURE.md" -ForegroundColor Cyan
Write-Host "  - k8s-dashboard\IMPLEMENTATION_SUMMARY.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host "Ready to start! " -NoNewline -ForegroundColor Green
Write-Host "Happy Kubernetes Monitoring!" -ForegroundColor Green
Write-Host ("=" * 71) -ForegroundColor Cyan
