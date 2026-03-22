# bapx.in VPS Deployment Guide

## Overview
This guide covers deploying and running the bapx.in platform on a VPS with Trailbase as the database and authentication provider.

## Prerequisites
- Ubuntu 22.04+ VPS with root access
- Domain pointing to VPS IP (bapx.in)
- Python 3.11+
- Node.js 20+
- pnpm

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    bapx.in VPS                       │
│                                                      │
│  ┌──────────────┐    ┌──────────────┐               │
│  │   Frontend   │    │    Backend   │               │
│  │  (Next.js)   │◄──►│  (FastAPI)   │               │
│  │  Port 3000   │    │  Port 8000   │               │
│  └──────────────┘    └──────┬───────┘               │
│                              │                        │
│                              ▼                        │
│                    ┌─────────────────┐               │
│                    │   Trailbase     │               │
│                    │  Port 4000/8081 │               │
│                    └────────┬────────┘               │
│                             │                         │
│                    ┌────────▼────────┐               │
│                    │  User Databases │               │
│                    │  /traildepot/   │               │
│                    │   data/*.db     │               │
│                    └─────────────────┘               │
└─────────────────────────────────────────────────────┘
```

## Installation Steps

### 1. System Dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install Python
apt install -y python3 python3-pip python3-venv

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install uv (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install Trailbase
curl -fsSL https://trailbase.io/install.sh | sh
```

### 2. Clone Repository

```bash
cd /root
git clone https://github.com/bapXai/bapx.in.git Agent
cd /root/Agent
```

### 3. Configure Trailbase

```bash
# Create Trailbase directories
mkdir -p /root/Agent/traildepot/data
mkdir -p /root/Agent/traildepot/secrets/keys
mkdir -p /root/Agent/trail_public

# Generate Trailbase keys (if not exists)
openssl ecparam -genkey -name prime256v1 -out /root/Agent/traildepot/secrets/keys/private_key.pem
openssl ec -in /root/Agent/traildepot/secrets/keys/private_key.pem -pubout -out /root/Agent/traildepot/secrets/keys/public_key.pem

# Configure Trailbase
cat > /root/Agent/traildepot/config.textproto << EOF
email {}
server {
  application_name: "TrailBase"
  logs_retention_sec: 604800
}
auth {
  auth_token_ttl_sec: 3600
  refresh_token_ttl_sec: 2592000
  jwt_secret: "$(openssl rand -hex 32)"
}
jobs {}
EOF
```

### 4. Start Trailbase as Systemd Service

```bash
# Create systemd service
cat > /etc/systemd/system/trailbase.service << EOF
[Unit]
Description=Trailbase Database
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/Agent
ExecStart=/root/.local/bin/.trailbase/trail run --admin-address 0.0.0.0:8081 --public-dir /root/Agent/trail_public
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
systemctl daemon-reload
systemctl enable trailbase
systemctl start trailbase

# Verify
systemctl status trailbase
curl http://localhost:4000/health
```

### 5. Configure Backend

```bash
cd /root/Agent/backend

# Create .env file
cat > .env << EOF
# Environment
ENV_MODE=production

# Trailbase Configuration
TRAILBASE_URL=http://localhost:4000/v1
TRAILBASE_ADMIN_KEY=vn2gVGUvxLMs9w5cwYK6
TRAILBASE_PUBLIC_URL=http://localhost:4000
TRAILBASE_JWT_SECRET=<your-jwt-secret-from-config>

# Redis (for caching)
REDIS_HOST=localhost
REDIS_PORT=6379

# Admin API Key (auto-generated if not set)
KORTIX_ADMIN_API_KEY=<generate-secure-random-key>

# LLM Providers (configure as needed)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Stripe (optional)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
EOF

# Install dependencies
cd /root/Agent/backend
uv sync
```

### 6. Create Backend Systemd Service

```bash
cat > /etc/systemd/system/bapx-backend.service << EOF
[Unit]
Description=bapx.in Backend API
After=network.target trailbase.service

[Service]
Type=simple
User=root
WorkingDirectory=/root/Agent/backend
Environment="PATH=/root/.local/bin:/usr/local/bin:/usr/bin:/bin"
ExecStart=/root/.local/bin/uv run api.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
systemctl daemon-reload
systemctl enable bapx-backend
systemctl start bapx-backend

# Verify
systemctl status bapx-backend
curl http://localhost:8000/health
```

### 7. Configure Frontend

```bash
cd /root/Agent/apps/frontend

# Create .env.local
cat > .env.local << EOF
NEXT_PUBLIC_ENV_MODE=production
NEXT_PUBLIC_TRAILBASE_URL=http://localhost:4000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000/v1
NEXT_PUBLIC_URL=https://bapx.in
NEXT_PUBLIC_FORCE_LOCALHOST=false
EOF

# Install dependencies
pnpm install

# Build
pnpm build
```

### 8. Create Frontend Systemd Service

```bash
cat > /etc/systemd/system/bapx-frontend.service << EOF
[Unit]
Description=bapx.in Frontend
After=network.target bapx-backend.service

[Service]
Type=simple
User=root
WorkingDirectory=/root/Agent/apps/frontend
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node .next/standalone/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
systemctl daemon-reload
systemctl enable bapx-frontend
systemctl start bapx-frontend

# Verify
systemctl status bapx-frontend
curl http://localhost:3000
```

### 9. Configure Nginx (Optional but Recommended)

```bash
# Install Nginx
apt install -y nginx

# Create Nginx config
cat > /etc/nginx/sites-available/bapx.in << EOF
server {
    listen 80;
    server_name bapx.in www.bapx.in;

    # Redirect to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name bapx.in www.bapx.in;

    # SSL certificates (use Certbot)
    ssl_certificate /etc/letsencrypt/live/bapx.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bapx.in/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    # Backend API
    location /v1 {
        proxy_pass http://localhost:8000/v1;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    # Trailbase (admin only, restrict IP)
    location /trailbase/ {
        # Allow only admin IPs
        allow <your-ip>;
        deny all;

        proxy_pass http://localhost:8081/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/bapx.in /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Install SSL certificate
apt install -y certbot python3-certbot-nginx
certbot --nginx -d bapx.in -d www.bapx.in
```

### 10. Verify Installation

```bash
# Check all services
systemctl status trailbase
systemctl status bapx-backend
systemctl status bapx-frontend
systemctl status nginx

# Test endpoints
curl http://localhost:4000/health          # Trailbase
curl http://localhost:8000/health          # Backend
curl http://localhost:3000                 # Frontend
curl https://bapx.in                       # Public URL

# Check logs
journalctl -u trailbase -f
journalctl -u bapx-backend -f
journalctl -u bapx-frontend -f
```

## Service Management

### Start/Stop Services

```bash
# Start all
systemctl start trailbase bapx-backend bapx-frontend

# Stop all
systemctl stop trailbase bapx-backend bapx-frontend

# Restart all
systemctl restart trailbase bapx-backend bapx-frontend

# View status
systemctl status trailbase bapx-backend bapx-frontend
```

### View Logs

```bash
# Trailbase logs
journalctl -u trailbase -f

# Backend logs
journalctl -u bapx-backend -f

# Frontend logs
journalctl -u bapx-frontend -f

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## User Management

### Create First Admin User

```bash
# Via API
curl -X POST http://localhost:4000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@bapx.in",
    "password": "secure-password-here"
  }'

# Verify user database was created
ls -la /root/Agent/traildepot/data/
# Should see: <user_id>.db
```

### Access Trailbase Admin UI

1. Open http://localhost:8081 (or https://bapx.in/trailbase/ from public)
2. Use admin key from config (default: `vn2gVGUvxLMs9w5cwYK6`)
3. Manage users, databases, and settings

## Backup Strategy

### Database Backup Script

```bash
cat > /root/backup-databases.sh << EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups/traildepot"
mkdir -p \$BACKUP_DIR

# Stop services
systemctl stop bapx-frontend bapx-backend

# Copy databases
cp -r /root/Agent/traildepot/data/*.db \$BACKUP_DIR/
cp -r /root/Agent/traildepot/data/*.db-wal \$BACKUP_DIR/ 2>/dev/null || true
cp -r /root/Agent/traildepot/data/*.db-shm \$BACKUP_DIR/ 2>/dev/null || true

# Compress
cd \$BACKUP_DIR
tar -czf traildepot-\$DATE.tar.gz *.db

# Cleanup old backups (keep 7 days)
find \$BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

# Start services
systemctl start bapx-frontend bapx-backend

echo "Backup completed: \$BACKUP_DIR/traildepot-\$DATE.tar.gz"
EOF

chmod +x /root/backup-databases.sh
```

### Add to Crontab

```bash
# Daily backup at 3 AM
crontab -e
# Add: 0 3 * * * /root/backup-databases.sh >> /var/log/backup.log 2>&1
```

## Monitoring

### Health Check Script

```bash
cat > /root/health-check.sh << EOF
#!/bin/bash

# Check Trailbase
if ! curl -s http://localhost:4000/health > /dev/null; then
    echo "CRITICAL: Trailbase is down"
    systemctl restart trailbase
fi

# Check Backend
if ! curl -s http://localhost:8000/health > /dev/null; then
    echo "CRITICAL: Backend is down"
    systemctl restart bapx-backend
fi

# Check Frontend
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "CRITICAL: Frontend is down"
    systemctl restart bapx-frontend
fi

echo "All services healthy"
EOF

chmod +x /root/health-check.sh
```

### Add to Crontab (every 5 minutes)

```bash
crontab -e
# Add: */5 * * * * /root/health-check.sh >> /var/log/health-check.log 2>&1
```

## Troubleshooting

### Trailbase Issues

```bash
# Check if running
ps aux | grep trail

# View logs
journalctl -u trailbase -n 100

# Restart
systemctl restart trailbase

# Check databases
ls -la /root/Agent/traildepot/data/
```

### Backend Issues

```bash
# Check logs
journalctl -u bapx-backend -n 100

# Check .env configuration
cat /root/Agent/backend/.env

# Test manually
cd /root/Agent/backend
uv run api.py
```

### Frontend Issues

```bash
# Check logs
journalctl -u bapx-frontend -n 100

# Rebuild
cd /root/Agent/apps/frontend
pnpm build

# Check .env.local
cat /root/Agent/apps/frontend/.env.local
```

### Database Corruption

```bash
# Stop services
systemctl stop bapx-frontend bapx-backend trailbase

# Remove WAL files (safe if services stopped)
rm /root/Agent/traildepot/data/*.db-wal
rm /root/Agent/traildepot/data/*.db-shm

# Start services
systemctl start trailbase bapx-backend bapx-frontend
```

## Security Hardening

### 1. Change Default Admin Key

Edit `/root/Agent/traildepot/config.textproto`:
```textproto
auth {
  jwt_secret: "<generate-new-secret>"
}
```

Update backend `.env`:
```bash
TRAILBASE_ADMIN_KEY=<new-key>
```

### 2. Firewall Configuration

```bash
# Install UFW
apt install -y ufw

# Allow SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Block direct access to internal services
ufw deny 4000/tcp
ufw deny 8000/tcp
ufw deny 3000/tcp
ufw deny 8081/tcp

# Enable firewall
ufw enable
```

### 3. Fail2Ban

```bash
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

## Performance Tuning

### Redis Caching (Optional)

```bash
# Install Redis
apt install -y redis-server

# Configure
cat >> /etc/redis/redis.conf << EOF
maxmemory 256mb
maxmemory-policy allkeys-lru
EOF

# Start
systemctl enable redis-server
systemctl start redis-server
```

### Database Optimization

Add to `/root/Agent/traildepot/config.textproto`:
```textproto
server {
  wal_autocheckpoint: 1000
  cache_size: 10000
}
```

## Updates

### Update Application

```bash
cd /root/Agent
git pull

# Restart services
systemctl restart bapx-backend bapx-frontend

# Check status
systemctl status bapx-backend bapx-frontend
```

### Update Trailbase

```bash
trail update
systemctl restart trailbase
```

## Support

For issues:
1. Check logs: `journalctl -u <service> -f`
2. Verify services: `systemctl status <service>`
3. Test endpoints: `curl http://localhost:<port>/health`
4. Review configuration files
5. Check disk space: `df -h`
6. Check memory: `free -h`
