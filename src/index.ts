#!/usr/bin/env node

import { loadConfig } from './config/config.js';
import { PostDatabase } from './database/db.js';
import { PostScheduler } from './scheduler/scheduler.js';

async function main() {
  console.log('🐕 =======================================');
  console.log('🐕   VINNY THE CHIHUAHUA - AI AGENT');
  console.log('🐕   Dog Health & Wellness Influencer');
  console.log('🐕 =======================================\n');

  try {
    // Load configuration
    const config = loadConfig();
    console.log('✅ Configuration loaded');

    // Initialize database
    const db = new PostDatabase();
    console.log('✅ Database initialized');

    // Initialize and start scheduler
    const scheduler = new PostScheduler(config, db);
    await scheduler.start();

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\n👋 Shutting down gracefully...');
      scheduler.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n\n👋 Shutting down gracefully...');
      scheduler.stop();
      process.exit(0);
    });

  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    console.error('\n💡 Please check your .env file and make sure all credentials are correct.');
    process.exit(1);
  }
}

main();
