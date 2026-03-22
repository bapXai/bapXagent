# Trailbase Migration Guide

## Overview
This document describes the migration from Supabase to Trailbase for authentication and database operations.

## Architecture Changes

### Before (Supabase)
- Cloud-hosted PostgreSQL database
- JWT-based authentication via Supabase Auth
- Row-level security for multi-tenancy
- Single database with schema-based isolation

### After (Trailbase)
- Self-hosted SQLite databases
- JWT-based authentication via Trailbase Auth
- File-based isolation (one DB per user)
- Complete data isolation per user

## Directory Structure
```
/root/Agent/traildepot/
├── data/
│   ├── main.db           # System database (users, auth)
│   ├── logs.db           # Trailbase system logs
│   └── {user_id}.db      # Per-user database (auto-created)
├── secrets/
│   ├── keys/
│   │   ├── private_key.pem
│   │   └── public_key.pem
│   └── secrets.textproto
└── config.textproto
```

## Authentication Flow

### User Signup
1. POST `/auth/signup` with email/password
2. Trailbase creates user in main.db
3. System auto-creates `{user_id}.db` for user data
4. Return JWT tokens

### User Login
1. POST `/auth/login` with email/password
2. Trailbase validates credentials
3. Return JWT tokens (access_token, refresh_token)

### API Authentication
1. Client includes `Authorization: Bearer <token>` header
2. Backend validates JWT using Trailbase public key
3. Extract user_id from token claims
4. Use user_id to access user's database

## Database Operations

### Creating a Project
```python
from core.services.trailbase_service import trailbase_service

# Create project in user's database
project = await trailbase_service.create_project(
    user_id="user_123",
    name="My Project",
    domain="myproject.bapx.in",  # Optional, user-selected
    config={"theme": "dark"}
)
```

### Querying User Data
```python
# Execute query in user's database
projects = await trailbase_service.execute_user_query(
    user_id="user_123",
    query="SELECT * FROM projects WHERE domain = :domain",
    params={"domain": "myproject.bapx.in"}
)
```

## Environment Variables

### Backend (.env)
```bash
# Trailbase Configuration
TRAILBASE_URL=http://localhost:4000/v1
TRAILBASE_ADMIN_KEY=vn2gVGUvxLMs9w5cwYK6
TRAILBASE_PUBLIC_URL=http://localhost:4000
TRAILBASE_JWT_SECRET=your-secret-key

# Remove Supabase variables
# SUPABASE_URL=...
# SUPABASE_ANON_KEY=...
# SUPABASE_SERVICE_ROLE_KEY=...
```

### Frontend (.env)
```bash
NEXT_PUBLIC_TRAILBASE_URL=http://localhost:4000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000/v1
NEXT_PUBLIC_URL=http://localhost:3000

# Remove Supabase variables
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## API Endpoints

### Trailbase Auth Endpoints
- `POST /auth/signup` - Create account
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `POST /auth/otp` - Send OTP
- `GET /auth/user` - Get current user
- `POST /auth/recover` - Password recovery

### Trailbase Admin Endpoints (port 8081)
- `GET /health` - Health check
- `GET /databases` - List databases
- `POST /databases` - Create database
- `GET /users` - List users

## Multi-tenant Architecture

### User Isolation
Each user gets:
- Separate SQLite database file
- Complete data isolation
- Independent schema evolution
- No cross-user queries possible

### Database Location
- User DBs: `/root/Agent/traildepot/data/{user_id}.db`
- Auto-created on first signup
- WAL mode for concurrency

### Project Tables (per user DB)
```sql
-- Projects table
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT,              -- User-selected subdomain
    created_at DATETIME,
    updated_at DATETIME,
    config JSON,
    user_id TEXT NOT NULL
);

-- Threads table
CREATE TABLE threads (
    id TEXT PRIMARY KEY,
    name TEXT,
    project_id TEXT,
    created_at DATETIME,
    updated_at DATETIME,
    metadata JSON
);

-- Messages table
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT,
    created_at DATETIME,
    metadata JSON
);

-- Agents table
CREATE TABLE agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    project_id TEXT,
    config JSON,
    created_at DATETIME,
    updated_at DATETIME
);
```

## Domain Selection (Wix-style)

### User Flow
1. User creates project with name "My Cool App"
2. User optionally selects domain: "mycoolapp.bapx.in"
3. Domain is stored in project config
4. User manually configures DNS CNAME record
5. No automatic Nginx routing

### Implementation
```python
# Domain selection during project creation
project = await trailbase_service.create_project(
    user_id=user_id,
    name="My Cool App",
    domain="mycoolapp.bapx.in",  # User-selected
    config={
        "dns_status": "pending",  # pending, verified, failed
        "dns_record": "CNAME mycoolapp.bapx.in"
    }
)
```

## Migration Steps

### 1. Stop Services
```bash
python start.py stop
```

### 2. Backup Data (if migrating from existing Supabase)
```bash
# Export Supabase data
# Import to Trailbase format
```

### 3. Update Configuration
- Update backend `.env` with Trailbase variables
- Update frontend `.env.local` with Trailbase variables
- Remove all Supabase references

### 4. Start Trailbase (if not running)
```bash
# Trailbase should be running as systemd service
systemctl status trailbase
```

### 5. Start Backend
```bash
cd /root/Agent/backend
uv run api.py
```

### 6. Start Frontend
```bash
cd /root/Agent/apps/frontend
pnpm run dev
```

## Testing

### Test Authentication
```bash
# Signup
curl -X POST http://localhost:4000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123"}'

# Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123"}'
```

### Test Database Creation
```bash
# Check user DB was created
ls -la /root/Agent/traildepot/data/
# Should see: {user_id}.db
```

## Troubleshooting

### Trailbase Not Running
```bash
# Check process
ps aux | grep trail

# Start Trailbase
trail run --admin-address 0.0.0.0:8081 --public-dir /root/Agent/trail_public
```

### Database Not Created
- Check logs: `tail -f /root/Agent/traildepot/logs.db`
- Verify permissions: `ls -la /root/Agent/traildepot/data/`
- Check Trailbase health: `curl http://localhost:4000/health`

### Auth Failures
- Verify JWT secret matches in config
- Check token expiration
- Verify Trailbase admin key

## Admin Credentials

### Trailbase Admin UI
- URL: `http://localhost:8081`
- Admin Key: `vn2gVGUvxLMs9w5cwYK6` (default, change in production!)

### Backend Admin API
- Header: `X-Admin-Api-Key: <KORTIX_ADMIN_API_KEY>`
- Auto-generated on first run if not set

## Security Considerations

1. **Change Default Admin Key**: Update `TRAILBASE_ADMIN_KEY` in production
2. **File Permissions**: Ensure `/root/Agent/traildepot/data/` is not world-readable
3. **JWT Secret**: Use strong, unique secret for `TRAILBASE_JWT_SECRET`
4. **Backup Strategy**: Regular backups of `/root/Agent/traildepot/data/*.db`
