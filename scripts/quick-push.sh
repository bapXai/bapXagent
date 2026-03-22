#!/bin/bash
# Quick push to GitHub with credential helper

cd /root/Agent

echo "🚀 Pushing to GitHub..."
echo ""
echo "If prompted for credentials:"
echo "  Username: Your GitHub username"
echo "  Password: Your Personal Access Token (starts with ghp_)"
echo ""

git config pull.ff only
git push --force origin main

echo ""
echo "✅ Push complete!"
echo ""
echo "Verify at: https://github.com/bapXai/bapx.in"
