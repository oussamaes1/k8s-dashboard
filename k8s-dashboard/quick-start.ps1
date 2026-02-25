# K8s Dashboard - Quick Start Script (Windows PowerShell)
# This script helps you set up and run the dashboard quickly

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "K8s Dashboard - Quick Start" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Minikube is installed
if (-not (Get-Command minikube -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Minikube is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   https://minikube.sigs.k8s.io/docs/start/" -ForegroundColor Yellow
    exit 1
}

# Check if kubectl is installed
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Host "❌ kubectl is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   https://kubernetes.io/docs/tasks/tools/" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Minikube and kubectl are installed" -ForegroundColor Green
Write-Host ""

# Check if Minikube is running
Write-Host "🔍 Checking Minikube status..." -ForegroundColor Cyan
$minikubeStatus = minikube status 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Minikube is running" -ForegroundColor Green
} else {
    Write-Host "⚠️  Minikube is not running. Starting Minikube..." -ForegroundColor Yellow
    minikube start --driver=docker
    Write-Host "✅ Minikube started" -ForegroundColor Green
}
Write-Host ""

# Enable metrics-server
Write-Host "🔍 Checking metrics-server..." -ForegroundColor Cyan
$metricsServer = kubectl get deployment metrics-server -n kube-system 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ metrics-server is already enabled" -ForegroundColor Green
} else {
    Write-Host "⚠️  Enabling metrics-server..." -ForegroundColor Yellow
    minikube addons enable metrics-server
    Write-Host "✅ metrics-server enabled" -ForegroundColor Green
    Write-Host "⏳ Waiting for metrics-server to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}
Write-Host ""

# Verify cluster
Write-Host "🔍 Verifying cluster..." -ForegroundColor Cyan
kubectl cluster-info
Write-Host ""
kubectl get nodes
Write-Host ""

# Check Python
Write-Host "🔍 Checking Python..." -ForegroundColor Cyan
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python is not installed. Please install Python 3.11+" -ForegroundColor Red
    exit 1
}
$pythonVersion = python --version
Write-Host "✅ $pythonVersion found" -ForegroundColor Green
Write-Host ""

# Check Node.js
Write-Host "🔍 Checking Node.js..." -ForegroundColor Cyan
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}
$nodeVersion = node --version
Write-Host "✅ Node.js $nodeVersion found" -ForegroundColor Green
Write-Host ""

# Setup Backend
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Setting up Backend..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Set-Location backend

if (-not (Test-Path "venv")) {
    Write-Host "📦 Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

Write-Host "🔧 Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

Write-Host "📦 Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt -q

if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item .env.example .env
}

Write-Host "✅ Backend setup complete" -ForegroundColor Green
Write-Host ""

# Setup Frontend
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Setting up Frontend..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Set-Location ../frontend

if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing npm dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "✅ Frontend setup complete" -ForegroundColor Green
Write-Host ""

# Final instructions
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the application:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣  Backend (Terminal 1):" -ForegroundColor Cyan
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "   uvicorn app.main:app --reload" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣  Frontend (Terminal 2):" -ForegroundColor Cyan
Write-Host "   cd frontend" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "3️⃣  Access the dashboard:" -ForegroundColor Cyan
Write-Host "   http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "📝 Default Login:" -ForegroundColor Yellow
Write-Host "   Admin: admin / admin" -ForegroundColor White
Write-Host "   User:  user / user" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "   - Setup Guide: README_SETUP.md" -ForegroundColor White
Write-Host "   - API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "   - Summary: REFACTORING_SUMMARY.md" -ForegroundColor White
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
