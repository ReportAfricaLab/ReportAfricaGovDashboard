#!/bin/bash
# === ReportAfrica EC2 First-Time Setup ===
# Run this ONCE after Terraform creates the EC2 instance
# Usage: ssh into EC2, then run: ./setup.sh

set -e

DOMAIN="api.reportafrica.com"
EMAIL="admin@reportafrica.com"

echo "=== Setting up ReportAfrica API Server ==="

# 1. Copy Nginx config
sudo cp /home/ec2-user/reportafrica/infra/nginx/api.conf /etc/nginx/conf.d/api.conf
sudo rm -f /etc/nginx/conf.d/default.conf

# 2. Start Nginx (HTTP only first for certbot)
sudo sed -i 's/listen 443/#listen 443/' /etc/nginx/conf.d/api.conf
sudo mkdir -p /var/www/certbot
sudo nginx -t && sudo systemctl restart nginx

# 3. Get SSL certificate
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $EMAIL

# 4. Restore full Nginx config with SSL
sudo cp /home/ec2-user/reportafrica/infra/nginx/api.conf /etc/nginx/conf.d/api.conf
sudo nginx -t && sudo systemctl restart nginx

# 5. Auto-renew SSL
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -

echo "=== Setup complete ==="
echo "Now run: ./deploy.sh"
