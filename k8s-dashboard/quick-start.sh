#!/bin/bash

# K8s Dashboard - Quick Start Script
# This script helps you set up and run the dashboard quickly

set -e

echo "=========================================="
echo "K8s Dashboard - Quick Start"
echo "=========================================="
echo ""

# Check if Minikube is installed
if ! command -v minikube &> /dev/null; then
    echo "❌ Minikube is not installed. Please install it first:"
    echo "   https://minikube.sigs.k8s.io/docs/start/"
    exit 1
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install it first:"
    echo "   https://kubernetes.io/docs/tasks/tools/"
    exit 1
fi

echo "✅ Minikube and kubectl are installed"
echo ""

# Check if Minikube is running
echo "🔍 Checking Minikube status..."
if minikube status &> /dev/null; then
    echo "✅ Minikube is running"
else
    echo "⚠️  Minikube is not running. Starting Minikube..."
    minikube start --driver=docker
    echo "✅ Minikube started"
fi
echo ""

# Enable metrics-server
echo "🔍 Checking metrics-server..."
if kubectl get deployment metrics-server -n kube-system &> /dev/null; then
    echo "✅ metrics-server is already enabled"
else
    echo "⚠️  Enabling metrics-server..."
    minikube addons enable metrics-server
    echo "✅ metrics-server enabled"
    echo "⏳ Waiting for metrics-server to be ready..."
    sleep 10
fi
echo ""

# Verify cluster
echo "🔍 Verifying cluster..."
kubectl cluster-info
echo ""
kubectl get nodes
echo ""

# Check Python
echo "🔍 Checking Python..."
if ! command -v python &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.11+"
    exit 1
fi
python_version=$(python --version 2>&1 | awk '{print $2}')
echo "✅ Python $python_version found"
echo ""

# Check Node.js
echo "🔍 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi
node_version=$(node --version)
echo "✅ Node.js $node_version found"
echo ""

# Setup Backend
echo "=========================================="
echo "Setting up Backend..."
echo "=========================================="
cd backend

if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python -m venv venv
fi

echo "🔧 Activating virtual environment..."
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate

echo "📦 Installing Python dependencies..."
pip install -r requirements.txt -q

if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
fi

echo "✅ Backend setup complete"
echo ""

# Setup Frontend
echo "=========================================="
echo "Setting up Frontend..."
echo "=========================================="
cd ../frontend

if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
fi

echo "✅ Frontend setup complete"
echo ""

# Final instructions
echo "=========================================="
echo "🎉 Setup Complete!"
echo "=========================================="
echo ""
echo "To start the application:"
echo ""
echo "1️⃣  Backend (Terminal 1):"
echo "   cd backend"
echo "   source venv/bin/activate  # or venv\\Scripts\\activate on Windows"
echo "   uvicorn app.main:app --reload"
echo ""
echo "2️⃣  Frontend (Terminal 2):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "3️⃣  Access the dashboard:"
echo "   http://localhost:5173"
echo ""
echo "📝 Default Login:"
echo "   Admin: admin / admin"
echo "   User:  user / user"
echo ""
echo "📚 Documentation:"
echo "   - Setup Guide: README_SETUP.md"
echo "   - API Docs: http://localhost:8000/docs"
echo "   - Summary: REFACTORING_SUMMARY.md"
echo ""
echo "=========================================="
