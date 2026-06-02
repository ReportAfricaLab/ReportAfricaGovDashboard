#!/bin/bash
# === ReportAfrica API Deploy Script ===
# Run this on the EC2 instance after first setup
# Usage: ./deploy.sh

set -e

APP_DIR="/home/ec2-user/reportafrica"
REPO_URL="https://github.com/YOUR_ORG/ReportAfricaApp.git"

echo "=== Deploying ReportAfrica API ==="

# Clone or pull latest
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR"
  git pull origin main
else
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# Build and run API container
docker build -t reportafrica-api -f apps/api/Dockerfile .

# Stop existing container if running
docker stop reportafrica-api 2>/dev/null || true
docker rm reportafrica-api 2>/dev/null || true

# Run API container
docker run -d \
  --name reportafrica-api \
  --restart always \
  -p 3001:3001 \
  --env-file /home/ec2-user/.env.production \
  reportafrica-api

echo "=== API deployed successfully ==="
echo "Health check: curl http://localhost:3001/api/v1/health"
