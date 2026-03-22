#!/bin/bash
# bapX.in - Push to GitHub Script
# This script pushes all local changes to the GitHub repository

set -e

echo "=========================================="
echo "  bapX.in - GitHub Push Script"
echo "=========================================="
echo ""

cd /root/Agent

echo "📊 Current Git Status:"
git status --short
echo ""

echo "📝 Recent Commits:"
git log --oneline -10
echo ""

echo "🔗 Remote Repository:"
git remote -v
echo ""

echo "⚠️  This will FORCE PUSH to origin/main"
echo "    All remote changes will be overwritten!"
echo ""

read -p "Do you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Push cancelled"
    exit 1
fi

echo ""
echo "📤 Pushing to GitHub..."
echo ""

# Method 1: Try with Personal Access Token
if [ -n "$GITHUB_TOKEN" ]; then
    echo "Using GITHUB_TOKEN for authentication..."
    git push --force origin main
    echo "✅ Push successful!"
    exit 0
fi

# Method 2: Try with SSH
if [ -f ~/.ssh/id_rsa ] || [ -f ~/.ssh/id_ed25519 ]; then
    echo "Using SSH for authentication..."
    git remote set-url origin git@github.com:bapXAi/bapx.in.git
    git push --force origin main
    echo "✅ Push successful!"
    exit 0
fi

# Method 3: Manual credential prompt
echo "⚠️  No authentication method found."
echo ""
echo "Please choose one of these options:"
echo ""
echo "1. Set GITHUB_TOKEN environment variable:"
echo "   export GITHUB_TOKEN=your_token_here"
echo "   Then run this script again"
echo ""
echo "2. Configure git credentials:"
echo "   git config --global credential.helper store"
echo "   git push --force origin main"
echo "   (Enter your GitHub username and token when prompted)"
echo ""
echo "3. Add SSH key:"
echo "   ssh-keygen -t ed25519"
echo "   Add ~/.ssh/id_ed25519.pub to GitHub SSH keys"
echo "   git remote set-url origin git@github.com:bapXAi/bapx.in.git"
echo "   Then run this script again"
echo ""

exit 1
