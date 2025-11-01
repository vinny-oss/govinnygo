#!/usr/bin/env node

import { startServer } from './server/api.js';

async function main() {
  console.log('🐕 =======================================');
  console.log('🐕   VINNY AI COMMAND CENTER');
  console.log('🐕   Agent Management Dashboard');
  console.log('🐕 =======================================\n');

  try {
    await startServer();

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\n👋 Shutting down gracefully...');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n\n👋 Shutting down gracefully...');
      process.exit(0);
    });

  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    console.error('\n💡 Please check your configuration and try again.');
    process.exit(1);
  }
}

main();
