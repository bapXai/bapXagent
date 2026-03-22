# bapx.in Quick Reference

## 🚀 Current Status

**✅ Trailbase is running** on your VPS at:
- Public API: `http://localhost:4000`
- Admin UI: `http://localhost:8081`
- Data Directory: `/root/Agent/traildepot/data/`

## 🔑 Admin Credentials

### Trailbase Admin
- **URL**: http://localhost:8081 (or https://bapx.in/trailbase/)
- **Admin Key**: `vn2gVGUvxLMs9w5cwYK6` (default)
- **Change in production**: Edit `/root/Agent/traildepot/config.textproto`

### Backend Admin API
- **Header**: `X-Admin-Api-Key: <KORTIX_ADMIN_API_KEY>`
- **Location**: Auto-generated on first run or set in backend `.env`

## 🌐 URLs

| Service | Local URL | Public URL |
|---------|-----------|------------|
| Frontend | http://localhost:3000 | https://bapx.in |
| Backend API | http://localhost:8000/v1 | https://bapx.in/v1 |
| Trailbase | http://localhost:4000 | (internal only) |
| Trailbase Admin | http://localhost:8081 | https://bapx.in/trailbase/ |

## 📁 File Locations

```
/root/Agent/
├── SPEC.MD                          # Updated specification
├── docs/
│   ├── TRAILBASE_MIGRATION.md       # Migration guide
│   └── VPS_DEPLOYMENT.md            # VPS deployment guide
├── backend/
│   ├── .env                         # Backend config (create from .env.example)
│   ├── core/services/
│   │   ├── trailbase.py             # Trailbase client (old)
│   │   └── trailbase_service.py     # New multi-tenant service
│   └── core/utils/config.py         # Updated config (Trailbase vars)
├── apps/frontend/
│   ├── .env.example                 # Updated for Trailbase
│   └── src/lib/trailbase/           # New Trailbase auth client
│       ├── client.ts                # Browser client
│       ├── server.ts                # SSR helpers
│       └── index.ts                 # Exports
└── traildepot/
    ├── data/
    │   ├── main.db                  # System DB (users, auth)
    │   ├── logs.db                  # Trailbase logs
    │   └── {user_id}.db             # Per-user databases (auto-created)
    ├── secrets/
    │   └── keys/
    │       ├── private_key.pem
    │       └── public_key.pem
    └── config.textproto             # Trailbase config
```

## 🔧 Service Management

### Start/Stop Services
```bash
# Using the service manager
python start.py start    # Start all
python start.py stop     # Stop all
python start.py status   # Check status

# Using systemd (VPS)
systemctl start trailbase bapx-backend bapx-frontend
systemctl stop trailbase bapx-backend bapx-frontend
systemctl restart trailbase bapx-backend bapx-frontend
```

### View Logs
```bash
# Systemd logs
journalctl -u trailbase -f
journalctl -u bapx-backend -f
journalctl -u bapx-frontend -f

# Application logs
tail -f /root/Agent/backend.log
tail -f /root/Agent/frontend.log
```

## 🧪 Testing

### Test Trailbase
```bash
# Health check
curl http://localhost:4000/health

# Create user
curl -X POST http://localhost:4000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123"}'

# Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123"}'

# Check user DB created
ls -la /root/Agent/traildepot/data/
```

### Test Backend
```bash
# Health check
curl http://localhost:8000/health

# Get user projects (requires auth token)
curl http://localhost:8000/v1/projects \
  -H "Authorization: Bearer <token>"
```

### Test Frontend
```bash
# Check frontend
curl http://localhost:3000

# Open in browser
# http://localhost:3000
```

## 🗄️ Multi-Tenant Architecture

### User Isolation
Each user gets their own SQLite database:
```
User signs up → main.db stores user credentials
              → Auto-creates {user_id}.db for user data
              → All projects/threads in user's DB only
```

### Database Schema (per user)
```sql
-- Projects (with user-selected domain)
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT,              -- e.g., "myproject.bapx.in"
    created_at DATETIME,
    updated_at DATETIME,
    config JSON,
    user_id TEXT NOT NULL
);

-- Threads
CREATE TABLE threads (
    id TEXT PRIMARY KEY,
    name TEXT,
    project_id TEXT,
    created_at DATETIME,
    updated_at DATETIME,
    metadata JSON
);

-- Messages
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT,
    created_at DATETIME,
    metadata JSON
);

-- Agents
CREATE TABLE agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    project_id TEXT,
    config JSON,
    created_at DATETIME,
    updated_at DATETIME
);
```

## 🌐 Domain Selection (Wix-style)

Users manually select their subdomain during project creation:

```python
# Example: Create project with custom domain
project = await trailbase_service.create_project(
    user_id="user_123",
    name="My Cool App",
    domain="mycoolapp.bapx.in",  # User-selected
    config={
        "dns_status": "pending",
        "dns_record": "CNAME mycoolapp.bapx.in"
    }
)
```

**Note**: No automatic Nginx routing. Users configure DNS manually.

## 🔐 Environment Variables

### Backend (.env)
```bash
# Environment
ENV_MODE=production

# Trailbase
TRAILBASE_URL=http://localhost:4000/v1
TRAILBASE_ADMIN_KEY=vn2gVGUvxLMs9w5cwYK6
TRAILBASE_PUBLIC_URL=http://localhost:4000
TRAILBASE_JWT_SECRET=<your-secret>

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Admin
KORTIX_ADMIN_API_KEY=<auto-generated>

# LLM APIs (optional)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_ENV_MODE=production
NEXT_PUBLIC_TRAILBASE_URL=http://localhost:4000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000/v1
NEXT_PUBLIC_URL=https://bapx.in
```

## 📝 Next Steps

### Immediate Actions
1. **Create first user**: Use signup form at http://localhost:3000
2. **Verify user DB**: Check `/root/Agent/traildepot/data/{user_id}.db`
3. **Test project creation**: Create a project with custom domain
4. **Update frontend auth**: Replace Supabase client calls with Trailbase

### Production Checklist
- [ ] Change default `TRAILBASE_ADMIN_KEY`
- [ ] Generate strong `TRAILBASE_JWT_SECRET`
- [ ] Configure SSL certificates
- [ ] Set up firewall (UFW)
- [ ] Configure backup cron job
- [ ] Set up monitoring/health checks
- [ ] Update DNS records
- [ ] Test all auth flows

## 🐛 Troubleshooting

### Trailbase not responding
```bash
# Check if running
ps aux | grep trail

# Restart
systemctl restart trailbase

# Check logs
journalctl -u trailbase -n 50
```

### User DB not created
```bash
# Check Trailbase logs
tail -f /root/Agent/traildepot/logs.db

# Manually create
sqlite3 /root/Agent/traildepot/data/{user_id}.db "SELECT 1"
```

### Auth failures
```bash
# Verify JWT secret matches in:
# - /root/Agent/traildepot/config.textproto
# - Backend .env (TRAILBASE_JWT_SECRET)

# Check token expiration
# Default: 1 hour access, 30 days refresh
```

### Database locked
```bash
# Stop services
systemctl stop bapx-frontend bapx-backend trailbase

# Remove WAL files
rm /root/Agent/traildepot/data/*.db-wal
rm /root/Agent/traildepot/data/*.db-shm

# Restart
systemctl start trailbase bapx-backend bapx-frontend
```

## 📚 Documentation

- **SPEC.MD**: Updated specification (no SunaJanitor, no auto-routing)
- **docs/TRAILBASE_MIGRATION.md**: Complete migration guide
- **docs/VPS_DEPLOYMENT.md**: VPS deployment instructions
- **backend/core/services/trailbase_service.py**: Multi-tenant service
- **apps/frontend/src/lib/trailbase/**: Frontend auth client

## 🆘 Support Commands

```bash
# Quick health check
curl http://localhost:4000/health && \
curl http://localhost:8000/health && \
curl http://localhost:3000 > /dev/null && \
echo "✅ All services healthy" || echo "❌ Some services down"

# Check disk space
df -h /root/Agent

# Check memory
free -h

# Check running processes
ps aux | grep -E "trail|python.*api|node.*next" | grep -v grep

# View all service status
systemctl status trailbase bapx-backend bapx-frontend
```

---

**Last Updated**: 2026-03-22
**Version**: 1.0 (Trailbase Migration)
