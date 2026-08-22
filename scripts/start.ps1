$ErrorActionPreference = "Stop"

Write-Host "Starting GNK-ALGO..." -ForegroundColor Green

if (-not (Test-Path ".env")) {
    Write-Host ".env not found. Creating from .env.example..." -ForegroundColor Yellow

    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env" -Force
        Write-Host ".env created. Update CHANGE_ME secrets before production." -ForegroundColor Yellow
    }
    else {
        Write-Host ".env.example not found." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Environment file ready." -ForegroundColor Green

if (Test-Path "docker-compose.yml") {
    docker compose up -d --build
}
elseif (Test-Path "docker-compose.yaml") {
    docker compose up -d --build
}
else {
    Write-Host "Docker Compose file not found." -ForegroundColor Red
    exit 1
}

Write-Host "GNK-ALGO started successfully." -ForegroundColor Green
