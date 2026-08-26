#!/usr/bin/env bash
# Run on the Oracle VM after git clone. Stops the site calling api-dev.gnkalgo.com.
set -euo pipefail
cd /opt/gnkalgo

git fetch origin
git checkout cursor/gnkalgo-platform-1a67
git pull origin cursor/gnkalgo-platform-1a67

if [ -f .env ]; then
  sed -i 's|^NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=|' .env
  grep -q '^NEXT_PUBLIC_API_URL=' .env || echo 'NEXT_PUBLIC_API_URL=' >> .env
else
  echo "Missing /opt/gnkalgo/.env" >&2
  exit 1
fi

sudo cp deploy/nginx/www.gnkalgo.com.conf /etc/nginx/sites-available/
sudo cp deploy/nginx/api.gnkalgo.com.conf /etc/nginx/sites-available/
sudo nginx -t
sudo systemctl reload nginx

docker compose -f docker-compose.prod.yml build --no-cache frontend backend
docker compose -f docker-compose.prod.yml up -d

echo "If register 404s on /v1/auth/register, Nginx stripped /api. Copy nginx conf and rebuild backend."
echo "Optional Cloudflare DNS: A record name=api-dev content=this server public IP (Proxied)."
