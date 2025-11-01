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

  // Demo mode - allow running without credentials for UI preview
  const demoMode = missing.length > 0;

  if (demoMode) {
    console.warn('⚠️  Running in DEMO MODE - some features will be disabled');
    console.warn('⚠️  Missing credentials:', missing.join(', '));
  }

  return {
    twitter: {
      apiKey: process.env.TWITTER_API_KEY || 'demo',
      apiSecret: process.env.TWITTER_API_SECRET || 'demo',
      accessToken: process.env.TWITTER_ACCESS_TOKEN || 'demo',
      accessSecret: process.env.TWITTER_ACCESS_SECRET || 'demo',
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || 'demo',
    },
    postsPerDay: parseInt(process.env.POSTS_PER_DAY || '10', 10),
    timezone: process.env.TIMEZONE || 'America/Edmonton',
  };
}

// Export a singleton config instance
export const config = loadConfig();
