#!/bin/bash

# One-command script to update Vinny with new schedule and restart

echo "🐕 Updating Vinny to 4 AM - 8 PM Edmonton schedule..."

# Stop Vinny
echo "🛑 Stopping Vinny..."
pm2 stop vinny

# Pull latest code
echo "📥 Pulling latest code..."
git pull

# Update .env to use Edmonton timezone if not already set
echo "🌍 Setting timezone to America/Edmonton..."
sed -i 's/TIMEZONE=.*/TIMEZONE=America\/Edmonton/' .env

# Rebuild
echo "🔨 Building project..."
npm run build

# Restart Vinny
echo "🚀 Starting Vinny with new schedule..."
pm2 restart vinny

# Show logs
echo ""
echo "✅ Vinny updated! Here are the logs:"
echo ""
pm2 logs vinny --lines 30
