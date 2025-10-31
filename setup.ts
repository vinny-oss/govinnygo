#!/usr/bin/env node

import * as readline from 'readline';
import * as fs from 'fs';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);

interface Credentials {
  TWITTER_API_KEY: string;
  TWITTER_API_SECRET: string;
  TWITTER_ACCESS_TOKEN: string;
  TWITTER_ACCESS_SECRET: string;
  ANTHROPIC_API_KEY: string;
  POSTS_PER_DAY: string;
  TIMEZONE: string;
}

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function question(rl: readline.Interface, query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer.trim());
    });
  });
}

function questionHidden(rl: readline.Interface, query: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;

    // Disable echo
    if (stdin.isTTY) {
      (stdin as any).setRawMode(true);
    }

    let input = '';

    rl.question(query, () => {
      resolve(input);
    });

    stdin.on('data', (char: Buffer) => {
      const c = char.toString();

      switch (c) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl-D
          stdin.pause();
          if (stdin.isTTY) {
            (stdin as any).setRawMode(false);
          }
          process.stdout.write('\n');
          rl.close();
          resolve(input.trim());
          break;
        case '\u0003': // Ctrl-C
          process.exit(0);
          break;
        case '\u007f': // Backspace
        case '\b':
          if (input.length > 0) {
            input = input.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          input += c;
          process.stdout.write('*');
          break;
      }
    });
  });
}

async function main() {
  console.log('🐕 =======================================');
  console.log('🐕   VINNY SETUP - Secure Configuration');
  console.log('🐕 =======================================\n');

  console.log('This script will help you securely set up Vinny\'s credentials.\n');
  console.log('📝 Note: Your API keys will be hidden as you type (shown as ***).\n');

  const rl = createInterface();
  const credentials: Partial<Credentials> = {};

  try {
    // Twitter credentials
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📱 TWITTER/X API CREDENTIALS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Get these from: https://developer.twitter.com/en/portal/dashboard\n');

    credentials.TWITTER_API_KEY = await questionHidden(rl, 'Twitter API Key: ');

    const rl2 = createInterface();
    credentials.TWITTER_API_SECRET = await questionHidden(rl2, 'Twitter API Secret: ');

    const rl3 = createInterface();
    credentials.TWITTER_ACCESS_TOKEN = await questionHidden(rl3, 'Twitter Access Token: ');

    const rl4 = createInterface();
    credentials.TWITTER_ACCESS_SECRET = await questionHidden(rl4, 'Twitter Access Secret: ');

    // Anthropic credentials
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🤖 ANTHROPIC API CREDENTIALS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Get this from: https://console.anthropic.com/\n');

    const rl5 = createInterface();
    credentials.ANTHROPIC_API_KEY = await questionHidden(rl5, 'Anthropic API Key: ');

    // Configuration
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚙️  CONFIGURATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const rl6 = createInterface();
    const postsPerDay = await question(rl6, 'Posts per day (default: 10): ');
    credentials.POSTS_PER_DAY = postsPerDay || '10';

    const rl7 = createInterface();
    const timezone = await question(rl7, 'Timezone (default: America/New_York): ');
    credentials.TIMEZONE = timezone || 'America/New_York';

    // Validate
    console.log('\n🔍 Validating credentials...');

    const required = [
      'TWITTER_API_KEY',
      'TWITTER_API_SECRET',
      'TWITTER_ACCESS_TOKEN',
      'TWITTER_ACCESS_SECRET',
      'ANTHROPIC_API_KEY',
    ];

    const missing = required.filter(key => !credentials[key as keyof Credentials]);

    if (missing.length > 0) {
      console.error(`\n❌ Missing required credentials: ${missing.join(', ')}`);
      process.exit(1);
    }

    // Create .env file
    console.log('💾 Creating .env file...');

    const envContent = `# X/Twitter API Credentials
TWITTER_API_KEY=${credentials.TWITTER_API_KEY}
TWITTER_API_SECRET=${credentials.TWITTER_API_SECRET}
TWITTER_ACCESS_TOKEN=${credentials.TWITTER_ACCESS_TOKEN}
TWITTER_ACCESS_SECRET=${credentials.TWITTER_ACCESS_SECRET}

# Anthropic API Key
ANTHROPIC_API_KEY=${credentials.ANTHROPIC_API_KEY}

# Agent Configuration
POSTS_PER_DAY=${credentials.POSTS_PER_DAY}
TIMEZONE=${credentials.TIMEZONE}
`;

    await writeFile('.env', envContent);

    console.log('\n✅ SUCCESS! Configuration saved to .env\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 NEXT STEPS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('1. Test your setup:');
    console.log('   npm run dev\n');

    console.log('2. If successful, run in production:');
    console.log('   npm start\n');

    console.log('   OR with PM2:');
    console.log('   npm install -g pm2');
    console.log('   pm2 start ecosystem.config.cjs\n');

    console.log('   OR with Docker:');
    console.log('   docker-compose up -d\n');

    console.log('🐕 Vinny is ready to start posting! Good luck!\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
