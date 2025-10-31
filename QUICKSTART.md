# Vinny Quick Start Guide

Get Vinny posting in 3 simple steps!

## Step 1: Get Your API Credentials

### Twitter/X API
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create a new app (or use existing one)
3. Go to "Keys and Tokens" tab
4. Copy these 4 values (you'll need them in Step 2):
   - **API Key** (also called Consumer Key)
   - **API Secret** (also called Consumer Secret)
   - **Access Token**
   - **Access Token Secret**
5. **IMPORTANT**: Go to "Settings" → Make sure permissions are set to "Read and Write"

### Anthropic API
1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Go to "API Keys"
4. Click "Create Key"
5. Copy the key (starts with `sk-ant-...`)

## Step 2: Run the Setup Script

```bash
npm run setup
```

The script will prompt you to enter:
- Twitter API Key (hidden as you type)
- Twitter API Secret (hidden)
- Twitter Access Token (hidden)
- Twitter Access Secret (hidden)
- Anthropic API Key (hidden)
- Posts per day (default: 10)
- Timezone (default: America/New_York)

Your credentials will be saved securely to a `.env` file.

## Step 3: Start Vinny!

### Test First (Recommended)
```bash
npm run dev
```

Watch the output - you should see:
- ✅ Configuration loaded
- ✅ Database initialized
- ✅ Twitter credentials verified
- ✅ First tweet posted!

Press `Ctrl+C` to stop.

### Run in Production

Choose your preferred method:

**Direct Node:**
```bash
npm start
```

**With PM2 (recommended for servers):**
```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 logs vinny
```

**With Docker:**
```bash
docker-compose up -d
docker-compose logs -f
```

## That's It!

Vinny will now post 10 times per day automatically! 🐕✨

### Monitor Posts

Check the database:
```bash
sqlite3 vinny.db "SELECT datetime(posted_at), category, content FROM posts ORDER BY posted_at DESC LIMIT 5;"
```

### Troubleshooting

**"Failed to verify Twitter credentials"**
- Double-check your API keys in `.env`
- Ensure app has "Read and Write" permissions
- Try regenerating Access Token/Secret

**"Anthropic API error"**
- Verify API key is correct
- Check you have credits in your account

**Need to reset credentials?**
```bash
rm .env
npm run setup
```

Need more help? See [SETUP.md](./SETUP.md) for detailed documentation.
