SPEC.md - Bapx.in Digital OS Blueprint

# 1. Core Identity & Mission

**Project Name:** Bapx.in (Powered by Suna AI)

**Role:** An autonomous, multi-tenant SaaS "Digital Employee."

**Infrastructure:** Hosted on bapx.in VPS (production deployment environment).

**Backend:** Trailbase (Unified DB & Auth) - NO Supabase, NO Docker.

**Deployment:** This VPS IS the production environment. All development, testing, and deployment happens here.

# 2. Strict SaaS Guardrails (The Sandbox)

**Storage Limit:** Hard cap at 1GB for standard users; 25GB for Enterprise.

**Local Model Ban:** Intercept and block ollama, llama-cpp, torch, tensorflow.

**Inference Mode:** Strictly BYOK (Bring Your Own Key) via OpenAI-compatible proxy.

**Tool Restriction:** Prevent any local LLM installations.

# 3. Memory Architecture: Recursive LM (RLM)

**Engine:** Replace RAG with Recursive Language Models.

**Logic:** Use a persistent Python REPL. The agent must write code to filter/slice files into context variables.

**Brain Extension:** Decompose complex tasks into sub-recursive calls to handle infinite context lengths without "context rot."

# 4. Bapx Service Layer (Tools)

**TrailbaseManager:** Provision a separate Trailbase database per user. Each user gets their own isolated DB.
- User DBs are created at: `/root/Agent/traildepot/data/{user_id}.db`
- Projects within user DB create tables in the same user database
- No cross-user data access

**BapxProxy:** A unified gateway at `https://bapx.in/v1` that routes user BYOK keys for Text, Vision, and Audio.

**SocialDistributor:** One-toggle posting to IG, FB, X, LinkedIn, TikTok.

**AdWallet:** Check balance in the unified Bapx wallet before any paid execution.

**BrandConsistency:** All output must strictly follow `brand_kit.json` (Logos/Colors).

# 5. Hosting & Deployment (bapx.in)

**Production VPS:** This VPS is the ONLY deployment environment. No other deployments (Vercel, staging, etc.).

**Live Edit:** Enable real-time backend testing. Suna must edit code and restart services instantly.

**Domain Selection (Wix-style):**
- Users manually select their subdomain during project creation (e.g., `myproject.bapx.in`)
- Project name is separate from domain name
- Domain mapping is configured manually by user in DNS settings
- No automatic subdomain routing via Nginx

**Persistence:** Run Suna as a systemd service for 24/7 automation.

**UI Access:**
- Production URL: `https://bapx.in`
- Backend API: `https://bapx.in/v1`
- Trailbase Admin: `https://bapx.in/trailbase/` (restricted access)

**Service Architecture:**
- Frontend: Next.js on port 3000 (reverse proxy via Nginx)
- Backend: FastAPI on port 8000 (reverse proxy via Nginx)
- Trailbase: Port 4000 (public), 8081 (admin)
- All services accessed via `https://bapx.in` domain

# 6. DevOps & Versioning

**Repository:** `https://github.com/bapXAi/bapx.in.git` (main branch)

**Git Strategy:**
- Atomic commits for every successful "Live Edit" or feature update
- All changes committed and pushed to main branch
- This VPS is the live deployment - test before committing

**Monitoring:**
- Use Trailbase logs for system monitoring
- Health checks at `https://bapx.in/health`
- Service status via systemd

**Backup Strategy:**
- Daily backups of `/root/Agent/traildepot/data/*.db`
- Git repository backed up on GitHub

# 7. Multi-Tenant Architecture

**User Isolation:**
- Each user gets their own SQLite database file
- Complete data isolation - no cross-user queries possible
- Auto-created on signup at `/root/Agent/traildepot/data/{user_id}.db`

**Database Schema (per user):**
- `projects` - User projects with optional domain selection
- `threads` - Conversation threads
- `messages` - Chat messages
- `agents` - Agent configurations

# Execution Instructions for the Agent

1. **Initialize:** Read this SPEC.md entirely before writing any code.

2. **Audit:** Scan `/root/Agent` for existing Suna logic.

3. **Test:** Always test if UI is live at `https://bapx.in` before making changes.
   ```bash
   curl -sI https://bapx.in
   curl -s https://bapx.in/v1/health
   ```

4. **Patch:** Apply SaaS guardrails to `terminal.py` and `prompt.py` first.

5. **Build:** Implement the RLMExecutor and BapxProxy modules.

6. **Commit:** After every change:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin main
   ```

7. **Verify:** Test UI at `https://bapx.in` after deployment.

# Production URLs

| Service | URL |
|---------|-----|
| Frontend | `https://bapx.in` |
| Backend API | `https://bapx.in/v1` |
| Trailbase Public | `http://localhost:4000` (internal) |
| Trailbase Admin | `http://localhost:8081` (internal) |
| GitHub Repo | `https://github.com/bapXAi/bapx.in.git` |

# Admin Credentials

**Trailbase Admin Key:** `vn2gVGUvxLMs9w5cwYK6` (change in production!)

**Backend Admin API:** `X-Admin-Api-Key: <KORTIX_ADMIN_API_KEY>` (auto-generated)
