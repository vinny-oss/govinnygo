#!/bin/bash

echo "🐕 =========================================="
echo "🐕   VINNY COMPLETE RESET & UPDATE"
echo "🐕   Time-based schedule: 4 AM - 8 PM"
echo "🐕 =========================================="
echo ""

cd ~/govinnygo

# Stop Vinny completely
echo "🛑 Stopping Vinny..."
pm2 stop vinny 2>/dev/null || true
pm2 delete vinny 2>/dev/null || true

# Pull latest code
echo "📥 Pulling latest code with time-based schedule..."
git pull

# Update timezone in .env to Edmonton
echo "🌍 Setting timezone to America/Edmonton..."
if grep -q "TIMEZONE=" .env; then
    sed -i 's/TIMEZONE=.*/TIMEZONE=America\/Edmonton/' .env
else
    echo "TIMEZONE=America/Edmonton" >> .env
fi

# Show current timezone setting
echo "✅ Timezone set to: $(grep TIMEZONE .env)"

# Delete database to reset everything
echo "🗑️  Deleting old database (fresh start)..."
rm -f vinny.db

# Rebuild project
echo "🔨 Building project..."
npm run build

# Start fresh with PM2
echo "🚀 Starting Vinny with time-based schedule..."
pm2 start ecosystem.config.cjs

# Save PM2 config
pm2 save

echo ""
echo "✅ =========================================="
echo "✅   VINNY IS NOW RUNNING!"
echo "✅ =========================================="
echo ""
echo "📍 Posting times (Edmonton time):"
echo "   1. 4:00 AM    6. 12:00 PM"
echo "   2. 5:36 AM    7. 1:36 PM"
echo "   3. 7:12 AM    8. 3:12 PM"
echo "   4. 8:48 AM    9. 4:48 PM"
echo "   5. 10:24 AM   10. 6:24 PM"
echo ""
echo "💤 Silent hours: 8:00 PM - 4:00 AM"
echo ""
echo "📊 View logs: pm2 logs vinny"
echo "📈 View status: pm2 status"
echo ""

# Show logs
pm2 logs vinny --lines 20
