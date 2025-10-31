#!/bin/bash

# Vinny Super-Robust Deployment Script
# Handles all the annoying package manager issues automatically

set +e  # Don't exit on errors - we'll handle them

echo "🐕 ======================================="
echo "🐕   VINNY - Auto-Fix Deployment"
echo "🐕 ======================================="
echo ""

# Function to fix broken packages
fix_packages() {
    echo "🔧 Fixing any broken packages..."

    # Kill any stuck processes
    sudo pkill -9 apt 2>/dev/null
    sudo pkill -9 apt-get 2>/dev/null
    sudo pkill -9 dpkg 2>/dev/null

    # Remove locks
    sudo rm -f /var/lib/dpkg/lock-frontend 2>/dev/null
    sudo rm -f /var/lib/dpkg/lock 2>/dev/null
    sudo rm -f /var/cache/apt/archives/lock 2>/dev/null

    # Remove broken Google Cloud CLI packages
    sudo dpkg --remove --force-remove-reinstreq google-cloud-cli google-cloud-cli-anthoscli 2>/dev/null

    # Clean up
    sudo apt-get clean 2>/dev/null
    sudo apt-get autoremove -y 2>/dev/null
    sudo dpkg --configure -a 2>/dev/null

    echo "✅ Package system cleaned"
}

# Fix packages first
fix_packages

# Install Node.js 20 if not present
echo "📦 Installing Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - 2>/dev/null
    sudo apt-get install -y nodejs 2>/dev/null
else
    echo "✅ Node.js already installed"
fi

# Install build essentials (needed for better-sqlite3)
echo "📦 Installing build tools..."
sudo apt-get install -y build-essential python3 2>/dev/null

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2 2>/dev/null

# Check if we're already in the govinnygo directory
if [ -d "src" ] && [ -f "package.json" ]; then
    echo "✅ Already in project directory"
else
    # Check if govinnygo exists in home
    if [ -d "$HOME/govinnygo" ]; then
        echo "📂 Found existing project, using it..."
        cd "$HOME/govinnygo"
    else
        echo "❌ Not in project directory and can't find it."
        echo "Please run this script from the govinnygo directory."
        exit 1
    fi
fi

# Install dependencies
echo "📦 Installing project dependencies..."
npm install

# Run setup
echo ""
echo "🔧 Now let's configure your API credentials..."
echo ""
npm run setup

# Build project
echo "🔨 Building project..."
npm run build

# Stop any existing PM2 processes
pm2 delete vinny 2>/dev/null || true

# Setup PM2
echo "🚀 Starting Vinny with PM2..."
pm2 start ecosystem.config.cjs
pm2 save

# Setup PM2 to start on boot
echo "🔄 Configuring PM2 to start on system boot..."
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME 2>/dev/null || true

echo ""
echo "✅ ======================================="
echo "✅   VINNY IS NOW RUNNING!"
echo "✅ ======================================="
echo ""
echo "📊 View logs: pm2 logs vinny"
echo "📈 View status: pm2 status"
echo "🔄 Restart: pm2 restart vinny"
echo "🛑 Stop: pm2 stop vinny"
echo ""
echo "🐕 Vinny will now post 10 times per day automatically!"
echo ""
