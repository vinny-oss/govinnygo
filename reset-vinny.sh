#!/bin/bash

echo "🐕 =========================================="
echo "🐕   VINNY COMPLETE RESET & UPDATE"
echo "🐕   New Personality + Time Schedule"
echo "🐕 =========================================="
echo ""

cd ~/govinnygo

# Stop Vinny completely
echo "🛑 Stopping Vinny..."
pm2 stop vinny 2>/dev/null || true
pm2 delete vinny 2>/dev/null || true

# Pull latest code
echo "📥 Pulling latest code with new personality..."
git pull

# Update timezone and posts per day in .env
echo "🌍 Configuring for Edmonton timezone..."
if grep -q "TIMEZONE=" .env; then
    sed -i 's/TIMEZONE=.*/TIMEZONE=America\/Edmonton/' .env
else
    echo "TIMEZONE=America/Edmonton" >> .env
fi

if grep -q "POSTS_PER_DAY=" .env; then
    sed -i 's/POSTS_PER_DAY=.*/POSTS_PER_DAY=12/' .env
else
    echo "POSTS_PER_DAY=12" >> .env
fi

# Show current settings
echo "✅ Settings:"
grep "TIMEZONE=" .env
grep "POSTS_PER_DAY=" .env
echo ""

# Delete database to reset everything
echo "🗑️  Deleting old database (fresh start)..."
rm -f vinny.db

# Rebuild project
echo "🔨 Building project..."
npm run build

# Start fresh with PM2
echo "🚀 Starting Vinny with new personality..."
pm2 start ecosystem.config.cjs

# Save PM2 config
pm2 save

echo ""
echo "✅ =========================================="
echo "✅   VINNY IS NOW RUNNING!"
echo "✅   New Personality: Arrogant Expert"
echo "✅ =========================================="
echo ""
echo "📍 Posting times (Edmonton time):"
echo "   1. 4:00 AM - Good Morning 🌅"
echo "   2. 5:20 AM"
echo "   3. 6:40 AM"
echo "   4. 8:00 AM"
echo "   5. 9:20 AM"
echo "   6. 10:40 AM"
echo "   7. 12:00 PM - Lunch 🍽️"
echo "   8. 1:20 PM"
echo "   9. 2:40 PM"
echo "   10. 4:00 PM"
echo "   11. 5:20 PM"
echo "   12. 7:45 PM - Good Night 🌙"
echo ""
echo "💤 Silent hours: 8:00 PM - 4:00 AM"
echo ""
echo "🎯 New vibe: Confident dog expert, Gen Z energy"
echo "    No more 'woof woof' - talking to humans now"
echo ""
echo "📊 View logs: pm2 logs vinny"
echo "📈 View status: pm2 status"
echo ""

# Show logs
pm2 logs vinny --lines 25
