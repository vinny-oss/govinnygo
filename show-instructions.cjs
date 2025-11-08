// Shows the EXACT instructions Vinny uses
const { VinnyAgent } = require('./dist/agent/vinny.js');

const agent = new VinnyAgent({
  apiKey: 'dummy' // Not calling API, just showing prompts
});

console.log('═══════════════════════════════════════════════════════');
console.log('SYSTEM PROMPT (Personality & Rules):');
console.log('═══════════════════════════════════════════════════════');
console.log(agent.systemPrompt);

console.log('\n\n═══════════════════════════════════════════════════════');
console.log('USER PROMPT (What gets sent for "health_tip"):');
console.log('═══════════════════════════════════════════════════════');

const userPrompt = agent.buildPrompt({
  category: 'health_tip',
  recentPosts: [
    'Example recent post 1',
    'Example recent post 2',
  ]
});
console.log(userPrompt);

console.log('\n\n═══════════════════════════════════════════════════════');
console.log('API SETTINGS:');
console.log('═══════════════════════════════════════════════════════');
console.log('Model: claude-3-haiku-20240307');
console.log('Temperature: 0.8');
console.log('Max tokens: 200');
