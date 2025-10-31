# Complete Setup Guide for Vinny

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Twitter/X Developer Account
- Anthropic API Account

## Step-by-Step Setup

### 1. Get Twitter/X API Credentials

1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create a new project and app (or use existing)
3. Navigate to your app's "Keys and Tokens" section
4. Generate/Copy the following:
   - API Key (also called Consumer Key)
   - API Secret (also called Consumer Secret)
   - Access Token
   - Access Token Secret
5. **IMPORTANT**: Make sure your app has "Read and Write" permissions!
   - Go to "User authentication settings"
   - Set App permissions to "Read and Write"

### 2. Get Anthropic API Key

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-...`)

### 3. Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit the .env file with your credentials
nano .env
```

Fill in all the values:

```env
TWITTER_API_KEY=your_actual_api_key
TWITTER_API_SECRET=your_actual_api_secret
TWITTER_ACCESS_TOKEN=your_actual_access_token
TWITTER_ACCESS_SECRET=your_actual_access_secret
ANTHROPIC_API_KEY=sk-ant-your_actual_key
POSTS_PER_DAY=10
TIMEZONE=America/New_York
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Build the Project

```bash
npm run build
```

### 6. Test the Setup

```bash
# Run in development mode first to test
npm run dev
```

You should see:
- Configuration loaded ✅
- Database initialized ✅
- Twitter credentials verified ✅
- First post generated and published ✅

If you see any errors, check your credentials!

Press `Ctrl+C` to stop when testing is complete.

### 7. Run in Production

Choose one of these methods:

#### Option A: Direct Node (Simple)

```bash
npm start
```

Keep the terminal open. Use `screen` or `tmux` to keep it running after logout:

```bash
# Using screen
screen -S vinny
npm start
# Press Ctrl+A then D to detach
# Reattach with: screen -r vinny

# Using tmux
tmux new -s vinny
npm start
# Press Ctrl+B then D to detach
# Reattach with: tmux attach -t vinny
```

#### Option B: PM2 (Recommended for servers)

```bash
# Install PM2 globally
npm install -g pm2

# Start Vinny with PM2
pm2 start ecosystem.config.cjs

# View logs
pm2 logs vinny

# Stop
pm2 stop vinny

# Restart
pm2 restart vinny

# Make it run on system reboot
pm2 startup
pm2 save
```

#### Option C: Docker (Best for deployment)

```bash
# Build the image
docker-compose build

# Start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Monitoring

### View Recent Posts

```bash
# Connect to the SQLite database
sqlite3 vinny.db

# View recent posts
SELECT datetime(posted_at) as time, category, substr(content, 1, 50) as preview
FROM posts
WHERE success = 1
ORDER BY posted_at DESC
LIMIT 10;

# Count today's posts
SELECT COUNT(*) FROM posts
WHERE DATE(posted_at) = DATE('now') AND success = 1;

# Exit
.exit
```

### Check Logs

```bash
# Direct run: check terminal output

# PM2:
pm2 logs vinny

# Docker:
docker-compose logs -f vinny
```

## Troubleshooting

### "Failed to verify Twitter credentials"

- Double-check your API keys in `.env`
- Ensure your app has "Read and Write" permissions
- Try regenerating your Access Token and Access Secret

### "Missing required environment variables"

- Make sure your `.env` file exists and has all required variables
- No quotes needed around values in `.env` file

### "Anthropic API error"

- Check your API key is correct
- Ensure you have credits in your Anthropic account
- Check for rate limits

### "Daily limit reached" appearing immediately

- The database tracks posts by date
- If testing, delete `vinny.db` to reset the counter
- Or wait until the next day

## Customization

### Change Posting Frequency

Edit `.env`:
```env
POSTS_PER_DAY=5  # Change to any number
```

### Adjust Personality

Edit `src/agent/vinny.ts` - modify the `systemPrompt` variable

### Change Content Categories

Edit `src/agent/vinny.ts` - modify the `getRandomCategory()` method to adjust weights

## Support

If you encounter issues:
1. Check this guide first
2. Review error messages carefully
3. Verify all credentials are correct
4. Check the logs for detailed error information

Happy posting! 🐕✨
