// Quick test to see if the fix actually works
require('dotenv').config();
const { VinnyAgent } = require('./dist/agent/vinny.js');

console.log('🧪 Testing Vinny content generation...\n');

const agent = new VinnyAgent({
  apiKey: process.env.ANTHROPIC_API_KEY
});

agent.generateContent({
  category: 'health_tip',
  recentPosts: []
})
.then(content => {
  console.log('✅ SUCCESS! The fix works!\n');
  console.log('Generated tweet:');
  console.log(content);
  console.log('\n✅ Vinny can post again!');
  process.exit(0);
})
.catch(error => {
  console.log('❌ FAILED! Still broken!\n');
  console.log('Error:', error.message);
  process.exit(1);
});
