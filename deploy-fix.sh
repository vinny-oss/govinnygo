#!/bin/bash

echo "🔧 Deploying stop_sequences fix..."
echo ""

cd ~/govinnygo

# Stop Vinny
echo "🛑 Stopping Vinny..."
pm2 stop vinny 2>/dev/null || true
pm2 delete vinny 2>/dev/null || true

# Pull latest code with fix
echo "📥 Pulling latest code..."
git fetch origin
git checkout claude/vinny-dog-influencer-agent-011CUeMYQ2sX8LDcgmyWpVJ5
git pull origin claude/vinny-dog-influencer-agent-011CUeMYQ2sX8LDcgmyWpVJ5

# Show what commit we're on
echo ""
echo "📌 Current commit:"
git log --oneline -1
echo ""

# Clean and rebuild
echo "🧹 Cleaning old build..."
rm -rf dist

echo "🔨 Building project..."
npm run build

# Verify the fix is in the compiled code
echo ""
echo "✅ Verifying fix in compiled code..."
if grep -q "stop_sequences: \[" dist/agent/vinny.js; then
    echo "✅ Fix confirmed in vinny.js"
    grep "stop_sequences:" dist/agent/vinny.js
else
    echo "❌ Warning: Could not find stop_sequences in compiled code"
fi
echo ""

# Start Vinny
echo "🚀 Starting Vinny..."
pm2 start ecosystem.config.cjs
pm2 save

echo ""
echo "✅ =========================================="
echo "✅   DEPLOYMENT COMPLETE"
echo "✅ =========================================="
echo ""
echo "📊 Checking logs for errors..."
echo ""

# Show recent logs
pm2 logs vinny --lines 20 --nostream
