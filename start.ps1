# start.ps1
# This script starts the Docker containers, Backend (Uvicorn), and Frontend (Next.js)

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Starting HBTM Services..." -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 0. Kill existing instances (Karpathy: keep it simple)
Write-Host "`n[0/3] Cleaning up existing processes on ports 3000 and 8000..." -ForegroundColor Yellow
foreach ($port in @(3000, 8000)) {
    $proc = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($proc) {
        Stop-Process -Id $proc.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

# 1. Start Docker Containers (Database, etc.)
Write-Host "`n[1/3] Starting Docker containers (from backend/docker-compose.yml)..." -ForegroundColor Yellow
Set-Location -Path (Join-Path $ProjectRoot "backend")
docker-compose up -d
Set-Location -Path $ProjectRoot

# 2. Start Backend in a new window
Write-Host "[2/3] Starting Backend Server (Uvicorn)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn main:app --reload --port 8000"

# 3. Start Frontend in a new window
Write-Host "[3/3] Starting Frontend Server (Next.js)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd Frontend; npm run dev"

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "All services have been started!" -ForegroundColor Green
Write-Host "Backend is running in its own window." -ForegroundColor Green
Write-Host "Frontend is running in its own window." -ForegroundColor Green
Write-Host "Docker containers are running in the background." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
