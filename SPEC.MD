# SPEC.MD - bapx.in Digital OS Blueprint

**Project:** bapx.in (Powered by Suna AI)
**Domain:** https://bapx.in
**Codebase:** `/root/Agent` (MONOREPO)
**IMPORTANT:** This spec is ONLY for bapx.in. Do NOT modify `/root/Dev` (indoglobalservices.in) or any other projects.

**Status:** ✅ AUTH WORKING - Ready for user testing

---

## 1. Core Identity & Mission

**Project Name:** bapx.in (Powered by Suna AI)

**Role:** An autonomous, multi-tenant SaaS "Digital Employee."

**Infrastructure:** Hosted on bapx.in VPS using Trailbase for database and authentication.

**Backend:** Trailbase (Unified DB & Auth) - NO Supabase for core auth.

**Deployment:** This VPS (`/root/Agent`) IS the production environment for bapx.in only.

**⚠️ PROJECT ISOLATION:**
- **bapx.in** → `/root/Agent` (THIS PROJECT) ✅
- **indoglobalservices.in** → `/root/Dev` (SEPARATE PROJECT - DO NOT MODIFY) ❌
- These are completely separate applications with separate codebases

---

## 2. Architecture Overview

### Database & Authentication

**Primary Auth:** Trailbase (self-hosted) - ✅ WORKING
- User authentication: `http://localhost:4000/api/auth/v1/*`
- Admin UI: `http://localhost:8081`
- Data directory: `/root/Agent/traildepot/data/`

**Multi-Tenant Design:**
- Each user gets isolated SQLite database
- Location: `/root/Agent/traildepot/data/{user_id}.db`
- Tables per user DB: `projects`, `threads`, `messages`, `agents`
- No cross-user data access

**Supabase (OPTIONAL - User Tools Only):**
- NOT used for bapx.in authentication
- Users can connect THEIR OWN Supabase projects as external tools
- Configured via `NEXT_PUBLIC_USER_SUPABASE_URL` (empty by default)
- This is for integrations only, not core platform auth

### Admin Panel

**YES - Comprehensive Admin Panel Available**

1. **Trailbase Admin UI** (Database & Auth)
   - URL: `http://localhost:8081`
   - Purpose: Database management, user auth admin
   - Access: Admin key (`vn2gVGUvxLMs9w5cwYK6`)

2. **Suna Admin Dashboard** (Application Admin)
   - URL: `https://bapx.in/admin/*`
   - Pages: Feedback, Analytics, Notifications, Utils, Sandbox Pool, Stateless, Stress Test
   - Access: Requires `admin` or `super_admin` role

3. **Admin APIs**
   - Location: `/root/Agent/backend/core/admin/`
   - Auth: `X-Admin-Api-Key` header or user role
   - 9 admin modules with full CRUD operations

See `docs/ADMIN_PANEL.md` for complete documentation.

### Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | https://bapx.in | Main UI |
| Backend API | https://bapx.in/v1 | REST API |
| Trailbase Public | http://localhost:4000 | User auth & DB |
| Trailbase Admin | http://localhost:8081 | Admin only |

---

## 3. Strict SaaS Guardrails

**Storage Limit:** Hard cap at 1GB for standard users; 25GB for Enterprise.

**Local Model Ban:** Block ollama, llama-cpp, torch, tensorflow installations.

**Inference Mode:** Strictly BYOK (Bring Your Own Key) via OpenAI-compatible proxy.

**Tool Restriction:** Prevent any local LLM installations.

---

## 4. Memory Architecture: Recursive LM (RLM)

**Engine:** Replace RAG with Recursive Language Models.

**Logic:** Use a persistent Python REPL. The agent must write code to filter/slice files into context variables.

**Brain Extension:** Decompose complex tasks into sub-recursive calls to handle infinite context lengths without "context rot."

---

## 5. Bapx Service Layer (Tools)

**TrailbaseManager:** Provision a separate Trailbase database per user.
- User DBs: `/root/Agent/traildepot/data/{user_id}.db`
- Projects create tables within user's own database
- No cross-user data access

**BapxProxy:** Unified gateway at `https://bapx.in/v1` for BYOK routing (Text, Vision, Audio).

**SocialDistributor:** One-toggle posting to IG, FB, X, LinkedIn, TikTok.

**AdWallet:** Check balance before any paid execution.

**BrandConsistency:** All output must follow `brand_kit.json` (Logos/Colors).

---

## 6. Hosting & Deployment (bapx.in ONLY)

**Production VPS:** This VPS (`/root/Agent`) is the ONLY deployment for bapx.in.

**⚠️ DO NOT MODIFY:**
- `/root/Dev` - indoglobalservices.in (separate project)
- Any other directories outside `/root/Agent`

**Live Edit:** Enable real-time backend testing. Suna must edit code and restart services instantly.

**Domain Selection (Wix-style):**
- Users manually select subdomain during project creation (e.g., `myproject.bapx.in`)
- Project name is separate from domain name
- Domain mapping configured manually by user in DNS settings
- No automatic Nginx subdomain routing

**Persistence:** Run Suna as a systemd service for 24/7 automation.

**Service Architecture:**
```
┌─────────────────────────────────────────┐
│           bapx.in VPS                   │
│                                         │
│  ┌──────────────┐  ┌──────────────┐    │
│  │   Frontend   │  │    Backend   │    │
│  │  (Next.js)   │◄─┤  (FastAPI)   │    │
│  │  Port 3000   │  │  Port 8000   │    │
│  └──────────────┘  └──────┬───────┘    │
│                           │             │
│                           ▼             │
│                  ┌─────────────────┐   │
│                  │   Trailbase     │   │
│                  │  Port 4000/8081 │   │
│                  └────────┬────────┘   │
│                           │             │
│                  ┌────────▼────────┐   │
│                  │  User Databases │   │
│                  │  /traildepot/   │   │
│                  │   data/*.db     │   │
│                  └─────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 7. DevOps & Versioning

**Repository:** `https://github.com/bapXAi/bapx.in.git` (main branch)

**Git Strategy:**
- Atomic commits for every successful "Live Edit" or feature update
- All changes committed and pushed to main branch
- This VPS is the live deployment - test before committing

**⚠️ GIT SCOPE:**
- Only commit changes in `/root/Agent`
- Never touch `/root/Dev` or other directories

**Monitoring:**
- Use Trailbase logs for system monitoring
- Health checks at `https://bapx.in/health`
- Service status via systemd

**Backup Strategy:**
- Daily backups of `/root/Agent/traildepot/data/*.db`
- Git repository backed up on GitHub

---

## 8. Multi-Tenant Architecture

**User Isolation:**
- Each user gets their own SQLite database file
- Complete data isolation - no cross-user queries possible
- Auto-created on signup at `/root/Agent/traildepot/data/{user_id}.db`

**Database Schema (per user):**
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

---

## 9. Environment Configuration

### Backend (`.env`)
```bash
# Environment
ENV_MODE=production
LOG_LEVEL=INFO

# Trailbase (PRIMARY AUTH)
TRAILBASE_URL=http://localhost:4000/v1
TRAILBASE_ADMIN_KEY=vn2gVGUvxLMs9w5cwYK6
TRAILBASE_PUBLIC_URL=http://localhost:4000

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Encryption
MCP_CREDENTIAL_ENCRYPTION_KEY=<generated-key>

# LLM APIs (BYOK)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

### Frontend (`.env`)
```bash
# Trailbase (PRIMARY AUTH)
NEXT_PUBLIC_TRAILBASE_URL=http://localhost:4000
NEXT_PUBLIC_TRAILBASE_ANON_KEY=

# Backend API
NEXT_PUBLIC_BACKEND_URL=https://bapx.in/v1

# App URLs
NEXT_PUBLIC_URL=https://bapx.in

# User Supabase (OPTIONAL - for external tool integrations ONLY)
NEXT_PUBLIC_USER_SUPABASE_URL=
NEXT_PUBLIC_USER_SUPABASE_ANON_KEY=
```

---

## 10. Execution Instructions for the Agent

### Current Status (2026-03-22)
✅ **AUTH WORKING** - Trailbase authentication fully functional
✅ **UI LIVE** - https://bapx.in and https://bapx.in/auth returning 200 OK
✅ **Multi-tenant DB ready** - User databases auto-created at signup

### Next Steps (Priority Order)

1. **Test User Signup Flow** ✅ TODO
   - Visit https://bapx.in/auth
   - Create test account
   - Verify user DB created: `/root/Agent/traildepot/data/{user_id}.db`
   - Test login/logout

2. **Implement RLM (Recursive Language Model)** ✅ TODO
   - Create `backend/core/rlm/rlm_executor.py`
   - Implement persistent Python REPL for agent
   - Add code-based context filtering

3. **Build BapxProxy** ✅ TODO
   - BYOK routing for Text, Vision, Audio
   - OpenAI-compatible API at `/v1/chat/completions`

4. **Add SaaS Guardrails** ✅ TODO
   - Storage limits (1GB/25GB)
   - Local model blocking

5. **Dashboard Features** ✅ TODO
   - Project management
   - Thread/chat interface
   - Agent configuration

### Standard Workflow

1. **Initialize:** Read this SPEC.md entirely before writing any code.

2. **Scope Check:**
   - ✅ Work ONLY in `/root/Agent`
   - ❌ NEVER modify `/root/Dev` (indoglobalservices.in)
   - ❌ NEVER modify other projects

3. **Test:** Always test if UI is live at `https://bapx.in` before making changes.
   ```bash
   curl -sI https://bapx.in
   curl -s https://bapx.in/v1/health
   ```

4. **Check Console:** Always check Next.js console for errors after changes.
   - **React Components:** Must use PascalCase (e.g., `BapXLogo`, not `bapXLogo`)
   - **HTML Elements:** Must use lowercase (e.g., `div`, not `Div`)
   ```bash
   tail -f /root/Agent/frontend.log
   ```

5. **Patch:** Apply SaaS guardrails to `terminal.py` and `prompt.py` first.

6. **Build:** Implement the RLMExecutor and BapxProxy modules.

7. **Commit:** After every change:
   ```bash
   cd /root/Agent
   git add .
   git commit -m "Description of changes"
   git push origin main
   ```

8. **Verify:** Test UI at `https://bapx.in` after deployment.

---

## 11. Admin Credentials & Login

### User Login (Admins Use Same Login)
- **URL:** `https://bapx.in/auth`
- **Credentials:** Email + Password (same as regular users)
- **Admin Access:** Granted via `admin` role in `user_roles` table

### Trailbase Admin (Database Level)
- **URL:** `http://localhost:8081`
- **Admin Key:** `vn2gVGUvxLMs9w5cwYK6`
- **⚠️ ACTION REQUIRED:** Change in production!

### Backend Admin API
- **Header:** `X-Admin-Api-Key: <KORTIX_ADMIN_API_KEY>`
- **Auto-generated:** Check backend logs or `/root/Agent/backend/.env`

### Create First Admin User
See `docs/ADMIN_LOGIN.md` for complete setup instructions.

**Quick Setup:**
```bash
# 1. Create user account
curl -X POST http://localhost:4000/api/auth/v1/register \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@bapx.in", "password": "SecurePass123!", "password_repeat": "SecurePass123!"}'

# 2. Grant admin role (via SQLite)
sqlite3 /root/Agent/traildepot/data/main.db \
  "INSERT INTO user_roles (user_id, role) VALUES ('<user-id>', 'admin');"

# 3. Login at https://bapx.in/auth
```

---

## 12. Project Separation Summary

| Project | Domain | Directory | Status |
|---------|--------|-----------|--------|
| **bapx.in** | https://bapx.in | `/root/Agent` | ✅ AUTH WORKING |
| indoglobalservices.in | https://indoglobalservices.in | `/root/Dev` | ❌ DO NOT TOUCH |

**Rules:**
1. Only work in `/root/Agent`
2. Never modify `/root/Dev` or its contents
3. Never modify configs for indoglobalservices.in
4. Keep projects completely separate
5. Each project has its own domain, codebase, and deployment

---

**Last Updated:** 2026-03-22
**Version:** 2.1 (Auth Working - Ready for Testing)
**CTO Approved:** ✅
