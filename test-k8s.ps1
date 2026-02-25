# Quick Test Script - Run this after enabling Kubernetes
Write-Host "`n=== Testing Kubernetes ===" -ForegroundColor Cyan

kubectl get nodes

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ SUCCESS! Kubernetes is running!" -ForegroundColor Green
    Write-Host "`nYour kubeconfig is at: $env:USERPROFILE\.kube\config" -ForegroundColor Yellow
    Write-Host "`nNow you can add this cluster to your dashboard!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Still not running. Wait a bit longer or restart Docker Desktop." -ForegroundColor Red
}
