# 🔐 GitHub Authentication Setup

**Problem:** Git can't read your GitHub token automatically

**Solution:** Configure credentials manually

---

## ✅ Method 1: One-Time Manual Push (Recommended)

```bash
# 1. Navigate to repo
cd /root/Agent

# 2. Configure credential helper (first time only)
git config --global credential.helper store

# 3. Push (will prompt for credentials)
git push --force origin main

# When prompted:
# Username: [your-github-username]
# Password: [paste-your-personal-access-token]
#   (Token starts with: ghp_)
#   Get token from: https://github.com/settings/tokens
```

**After first push, credentials are saved and future pushes won't prompt.**

---

## ✅ Method 2: Use .netrc File (Non-Interactive)

```bash
# 1. Create .netrc file
cat > ~/.netrc << 'EOF'
machine github.com
login YOUR_GITHUB_USERNAME
password ghp_YOUR_PERSONAL_ACCESS_TOKEN
EOF

# 2. Set secure permissions
chmod 600 ~/.netrc

# 3. Push
cd /root/Agent
git push --force origin main
```

**Replace:**
- `YOUR_GITHUB_USERNAME` with your actual GitHub username
- `ghp_YOUR_PERSONAL_ACCESS_TOKEN` with your actual token

---

## ✅ Method 3: Use Git Credential with URL

```bash
# 1. Store credentials
echo "https://YOUR_USERNAME:ghp_YOUR_TOKEN@github.com" > ~/.git-credentials
chmod 600 ~/.git-credentials

# 2. Configure git
git config --global credential.helper store

# 3. Push
cd /root/Agent
git push --force origin main
```

---

## 🔑 Get Your Personal Access Token

1. **Go to:** https://github.com/settings/tokens
2. **Click:** "Generate new token (classic)"
3. **Note:** `bapx-in-vps`
4. **Select scopes:** ✅ **repo** (full control)
5. **Generate token**
6. **Copy token** (starts with `ghp_`)
7. **Use in one of the methods above**

---

## 🧪 Test Push

```bash
cd /root/Agent
git push --force origin main
```

**Expected output:**
```
Enumerating objects: XXX, done.
Counting objects: 100% (XXX/XXX), done.
Delta compression using up to X threads
Compressing objects: 100% (XXX/XXX), done.
Writing objects: 100% (XXX/XXX), XXX KiB | XXX MiB/s, done.
Total XXX (delta XXX), reused XXX (delta XXX), pack-reused XXX
remote: Resolving deltas: 100% (XXX/XXX), done.
To https://github.com/bapXAi/bapx.in.git
   XXXXXXX..XXXXXXX  main -> main
```

---

## ✅ Verify on GitHub

Visit: **https://github.com/bapXai/bapx.in**

You should see:
- ✅ All files restored (README.md, docker-compose.yaml, etc.)
- ✅ 18 new commits
- ✅ Latest commit message

---

## 🆘 Troubleshooting

### "Authentication failed"
- Token might be expired or invalid
- Generate new token at: https://github.com/settings/tokens
- Make sure token has **repo** scope

### "could not read Username"
- Credential helper not configured
- Run: `git config --global credential.helper store`
- Try push again

### "Permission denied"
- Token doesn't have repo access
- Regenerate token with full **repo** scope
- Make sure you're owner of bapXAi/bapx.in repository

---

## 📞 Quick Help

**Username:** Your GitHub username (e.g., `getwinharris`)  
**Password:** Personal Access Token (starts with `ghp_`)  
**Token URL:** https://github.com/settings/tokens

---

**Created:** 2026-03-22  
**For:** Manual credential setup
