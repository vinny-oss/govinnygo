# Deploy Vinny to Google Cloud - Complete Guide

This guide will walk you through deploying Vinny on Google Cloud using the browser SSH terminal.

## Step 1: Create a Google Cloud VM

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com
   - Select your project: **pawmugz** (or create it if needed)

2. **Create a VM Instance**
   - Go to: **Compute Engine** → **VM Instances**
   - Click **"CREATE INSTANCE"**

   **Recommended Settings:**
   - **Name:** `vinny-bot`
   - **Region:** Choose closest to you (e.g., `us-central1`)
   - **Machine type:** `e2-micro` (Free tier eligible - perfect for Vinny!)
   - **Boot disk:**
     - Click "CHANGE"
     - Select: **Ubuntu 22.04 LTS**
     - Size: **10 GB** (default is fine)
   - **Firewall:** No need to change (Vinny doesn't need external connections)

3. **Click "CREATE"** and wait for the VM to start (~30 seconds)

## Step 2: Connect via Browser SSH

1. In the VM Instances list, find your `vinny-bot` instance
2. Click the **"SSH"** button in the browser
3. A new browser window will open with a terminal

## Step 3: Run the One-Command Deploy

In the SSH terminal, copy and paste this entire command:

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/govinnygo/YOUR_BRANCH/deploy-gcloud.sh | bash
```

**OR** if you prefer to do it manually:

```bash
# Download the deployment script
git clone YOUR_REPO_URL govinnygo
cd govinnygo

# Make it executable
chmod +x deploy-gcloud.sh

# Run it
./deploy-gcloud.sh
```

## Step 4: Enter Your API Credentials

The script will prompt you for:

1. **Twitter API Key** (from https://developer.twitter.com/en/portal/dashboard)
2. **Twitter API Secret**
3. **Twitter Access Token**
4. **Twitter Access Secret**
5. **Anthropic API Key** (from https://console.anthropic.com/)
6. **Posts per day** (press Enter for default: 10)
7. **Timezone** (press Enter for default: America/New_York)

Your credentials will be hidden as you type (shown as ***).

## Step 5: Verify It's Working

After setup completes, check the logs:

```bash
pm2 logs vinny
```

You should see:
- ✅ Configuration loaded
- ✅ Database initialized
- ✅ Twitter credentials verified
- ✅ Tweet posted!

Press `Ctrl+C` to exit logs.

## Managing Vinny

### View Status
```bash
pm2 status
```

### View Logs
```bash
pm2 logs vinny
```

### Restart
```bash
pm2 restart vinny
```

### Stop
```bash
pm2 stop vinny
```

### View Recent Posts
```bash
sqlite3 vinny.db "SELECT datetime(posted_at), category, substr(content, 1, 50) FROM posts WHERE success = 1 ORDER BY posted_at DESC LIMIT 10;"
```

### Update Code
```bash
cd ~/govinnygo
git pull
npm install
npm run build
pm2 restart vinny
```

## Costs

The **e2-micro** instance is part of Google Cloud's free tier:
- **1 e2-micro instance per month** - FREE
- **30 GB of standard storage** - FREE
- **1 GB of egress per month** - FREE

Vinny uses minimal resources, so this should run completely free! 🎉

## Troubleshooting

### "Failed to verify Twitter credentials"
```bash
cd ~/govinnygo
nano .env
# Check your credentials, then:
pm2 restart vinny
```

### "Anthropic API error"
- Verify API key is correct in `.env`
- Check you have credits: https://console.anthropic.com/

### Reset and Start Over
```bash
cd ~/govinnygo
rm .env
npm run setup
pm2 restart vinny
```

## Firewall (Optional - for monitoring)

If you want to add a web dashboard later, you can open ports:
1. Go to **VPC Network** → **Firewall**
2. Create firewall rule
3. Allow TCP on desired port

## Keep VM Running 24/7

Your VM will run continuously. Vinny will:
- Post 10 times per day automatically
- Restart if it crashes (PM2 handles this)
- Start automatically if the VM reboots

## That's It!

Vinny is now running 24/7 on Google Cloud! 🐕✨

Check your Twitter/X account and watch the dog health tips roll in!
