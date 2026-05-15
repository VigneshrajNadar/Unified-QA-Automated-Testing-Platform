#!/usr/bin/env pwsh
# Startup script for QA Tool Project
# This script will:
# 1. Initialize and seed the database
# 2. Start the backend server
# 3. Start the frontend development server

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  QA Tool - Full Stack Startup Script  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory
$projectRoot = $PSScriptRoot

# Check if Node.js is installed
Write-Host "[1/5] Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Install server dependencies
Write-Host ""
Write-Host "[2/5] Installing server dependencies..." -ForegroundColor Yellow
Set-Location "$projectRoot\server"
if (-Not (Test-Path "node_modules")) {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to install server dependencies" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✓ Server dependencies ready" -ForegroundColor Green

# Install client dependencies
Write-Host ""
Write-Host "[3/5] Installing client dependencies..." -ForegroundColor Yellow
Set-Location "$projectRoot\client"
if (-Not (Test-Path "node_modules")) {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to install client dependencies" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✓ Client dependencies ready" -ForegroundColor Green

# Seed the database
Write-Host ""
Write-Host "[4/5] Initializing and seeding database..." -ForegroundColor Yellow
Set-Location "$projectRoot\server"
node seed_demo.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ Database seeding encountered issues, but continuing..." -ForegroundColor Yellow
} else {
    Write-Host "✓ Database initialized and seeded" -ForegroundColor Green
}

# Start the servers
Write-Host ""
Write-Host "[5/5] Starting servers..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Backend Server (Port 5000)   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start backend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\server'; Write-Host 'Backend Server Starting...' -ForegroundColor Green; npm start"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Frontend Server (Port 5173)  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start frontend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\client'; Write-Host 'Frontend Server Starting...' -ForegroundColor Green; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  🚀 Application Started Successfully!  " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend API:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend App: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Default Login Credentials:" -ForegroundColor Yellow
Write-Host "  Email:    admin@meghana.com" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
