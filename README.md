# Vinny the Chihuahua - AI Dog Health Influencer

Meet Vinny, the health-conscious Chihuahua who's the "Don't Die" (Brian Johnson) of dogs! 🐕

## Overview

Vinny is an AI-powered X/Twitter bot that posts engaging content about:
- Dog health and wellness
- Fitness and exercise tips for dogs
- Safety guidelines for pet owners
- Longevity and preventive care
- Fun dog jokes and stories
- Interesting dog facts

Posts 10 times per day to stay within free tier limits.

## Quick Setup (Easiest!)

Run the interactive setup script - it will securely prompt for all your credentials:

```bash
npm run setup
```

Then start Vinny:
```bash
npm run dev  # Test first
npm start    # Or run in production
```

See [QUICKSTART.md](./QUICKSTART.md) for detailed step-by-step instructions!

## Manual Setup

### 1. Get X/Twitter API Credentials

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app (or use existing)
3. Get your API Key, API Secret, Access Token, and Access Secret
4. Make sure the app has **Read and Write** permissions

### 2. Get Anthropic API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create an API key
3. You'll need credits - they offer free tier for testing

### 3. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your credentials
nano .env
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Build and Run

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## Features

- **Smart Scheduling**: Posts spread evenly throughout the day
- **Content Variety**: Different types of posts (tips, jokes, stories, facts)
- **No Repetition**: Tracks post history to avoid repeating content
- **Character Consistency**: Maintains Vinny's zippy Chihuahua personality
- **Free Tier Friendly**: Exactly 10 posts per day

## Architecture

- `src/index.ts` - Main entry point
- `src/agent/vinny.ts` - Vinny's personality and content generation
- `src/twitter/client.ts` - X/Twitter API integration
- `src/scheduler/scheduler.ts` - Post scheduling logic
- `src/database/db.ts` - SQLite database for tracking posts
- `src/config/config.ts` - Configuration management

## Running Continuously

To keep Vinny posting 24/7, you can:

1. **Run on a server** (VPS, AWS, etc.)
2. **Use PM2**: `npm install -g pm2 && pm2 start dist/index.js --name vinny`
3. **Docker**: Build a Docker container for easy deployment
4. **Cloud Function**: Deploy as a scheduled cloud function

## License

MIT
