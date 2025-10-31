#!/bin/bash

# Vinny Deployment Script for Google Cloud
# This script sets up Vinny on a fresh Google Cloud VM

set -e

echo "🐕 ======================================="
echo "🐕   VINNY - Google Cloud Deployment"
echo "🐕 ======================================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  Please don't run as root. Run as a regular user."
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# Install Node.js 20
echo "📦 Installing Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install build essentials (needed for better-sqlite3)
echo "📦 Installing build tools..."
sudo apt-get install -y build-essential python3

# Install Git if not present
if ! command -v git &> /dev/null; then
    echo "📦 Installing Git..."
    sudo apt-get install -y git
fi

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Clone or update repository
if [ -d "govinnygo" ]; then
    echo "📂 Repository exists, pulling latest changes..."
    cd govinnygo
    git pull
else
    echo "📂 Cloning repository..."
    read -p "Enter your GitHub repository URL: " REPO_URL
    git clone "$REPO_URL" govinnygo
    cd govinnygo
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

# Setup PM2
echo "🚀 Setting up PM2..."
pm2 start ecosystem.config.cjs
pm2 save

# Setup PM2 to start on boot
echo "🔄 Configuring PM2 to start on system boot..."
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

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
