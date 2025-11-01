import { config as dotenvConfig } from 'dotenv';
import { Config } from '../types/index.js';

dotenvConfig();

export function loadConfig(): Config {
  const requiredEnvVars = [
    'TWITTER_API_KEY',
    'TWITTER_API_SECRET',
    'TWITTER_ACCESS_TOKEN',
    'TWITTER_ACCESS_SECRET',
    'ANTHROPIC_API_KEY'
  ];

  const missing = requiredEnvVars.filter(v => !process.env[v]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    twitter: {
      apiKey: process.env.TWITTER_API_KEY!,
      apiSecret: process.env.TWITTER_API_SECRET!,
      accessToken: process.env.TWITTER_ACCESS_TOKEN!,
      accessSecret: process.env.TWITTER_ACCESS_SECRET!,
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY!,
    },
    postsPerDay: parseInt(process.env.POSTS_PER_DAY || '10', 10),
    timezone: process.env.TIMEZONE || 'America/New_York',
  };
}

// Export a singleton config instance
export const config = loadConfig();
