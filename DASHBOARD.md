# Vinny AI Command Center

A beautiful web dashboard to manage and monitor Vinny the Chihuahua AI bot.

## Features

- **Real-time Bot Control** - Start/stop the bot with a single click
- **Live Status Monitoring** - See bot status, uptime, and posting statistics
- **Post History** - View all posts with category filtering
- **Configuration Management** - Adjust posts per day and timezone settings
- **Preview Mode** - Generate and preview posts before they go live
- **Manual Posting** - Trigger posts manually when needed
- **Multi-Agent Ready** - Built to support multiple agents in the future

## Quick Start

### Development Mode

Start the dashboard in development mode:

```bash
npm run dev:server
```

Then open your browser to: **http://localhost:3000**

### Production Mode

1. Build the TypeScript:

```bash
npm run build
```

2. Start the server:

```bash
npm run start:server
```

The dashboard will be available at: **http://localhost:3000**

## Dashboard Sections

### 1. Control Panel
- **Start Bot** - Starts Vinny's automated posting
- **Stop Bot** - Stops the bot gracefully
- **Post Now** - Manually trigger a post immediately
- **Preview Post** - Generate a preview without posting
- **Refresh** - Manually refresh all data

### 2. Active Agents
- View all active agents (currently just Vinny)
- See posts today and total posts per agent
- Agent status indicator (active/inactive)

### 3. Configuration
- **Posts Per Day** - Set how many posts Vinny makes daily (1-50)
- **Timezone** - Set the timezone for active hours
- Note: Changing config automatically restarts the bot

### 4. Post History
- View recent posts with timestamps
- Filter by category (health tips, fitness, safety, etc.)
- See time ago for each post
- Color-coded by category

### 5. Statistics
- Total posts all-time
- Posts today
- Category breakdown

## API Endpoints

The dashboard uses a REST API with these endpoints:

- `GET /api/status` - Get bot status and statistics
- `POST /api/start` - Start the bot
- `POST /api/stop` - Stop the bot
- `GET /api/posts` - Get post history
- `POST /api/post-now` - Trigger manual post
- `POST /api/test-post` - Generate preview post
- `GET /api/config` - Get current configuration
- `PUT /api/config` - Update configuration
- `GET /api/stats` - Get detailed statistics
- `GET /api/agents` - List all agents

## Environment Variables

The dashboard uses the same environment variables as the bot:

```bash
# Twitter/X API Credentials
TWITTER_API_KEY=your_key
TWITTER_API_SECRET=your_secret
TWITTER_ACCESS_TOKEN=your_token
TWITTER_ACCESS_SECRET=your_access_secret

# Anthropic API
ANTHROPIC_API_KEY=your_anthropic_key

# Bot Configuration
POSTS_PER_DAY=10
TIMEZONE=America/Edmonton

# Server Port (optional)
PORT=3000
```

## Active Hours

Vinny posts between **4 AM - 8 PM** in the configured timezone (default: Edmonton).

## Tech Stack

- **Backend**: Express.js, TypeScript
- **Frontend**: Vanilla JavaScript, Tailwind CSS
- **Database**: SQLite (better-sqlite3)
- **AI**: Claude (Anthropic)
- **Social**: Twitter API v2

## Running Both Bot and Dashboard

You have two options:

**Option 1: Dashboard Only** (Recommended)
```bash
npm run dev:server
```
Control the bot through the web interface.

**Option 2: Headless Bot**
```bash
npm run dev
```
Runs the bot without the dashboard (CLI only).

## Troubleshooting

**Dashboard won't start?**
- Make sure all environment variables are set in `.env`
- Run `npm install` to ensure dependencies are installed
- Check port 3000 is not already in use

**Bot won't start from dashboard?**
- Verify Twitter credentials in `.env`
- Check Anthropic API key is valid
- Look at console logs for detailed error messages

**Posts not showing?**
- Ensure the database file `vinny.db` exists
- Check that posts have been made (either manually or automatically)

## Future Enhancements

- Multiple agent support
- Tweet scheduling interface
- Analytics and insights
- Engagement metrics
- Response management
- Custom personality editor
