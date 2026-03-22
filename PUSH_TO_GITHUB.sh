#!/bin/bash
# Push to GitHub - bapXai/bapXagent

echo "🚀 Pushing bapX to GitHub..."
echo ""
echo "Repository: https://github.com/bapXai/bapXagent.git"
echo ""

cd /root/Agent

echo "📊 Current Status:"
git status --short
echo ""

echo "📝 Recent Commits:"
git log --oneline -5
echo ""

echo "⚠️  This will FORCE PUSH to GitHub"
echo ""
echo "To complete the push, you need to:"
echo "1. Enter your GitHub username when prompted"
echo "2. Enter your Personal Access Token when prompted"
echo ""
echo "Get token from: https://github.com/settings/tokens"
echo "Token needs 'repo' scope"
echo ""
read -p "Press Enter to continue..."

# Configure credential helper
git config --global credential.helper store

# Push to GitHub
git push --force origin main

echo ""
echo "✅ Push complete!"
echo ""
echo "Verify at: https://github.com/bapXai/bapXagent"
