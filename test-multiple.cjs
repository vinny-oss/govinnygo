const { VinnyAgent } = require('./dist/agent/vinny.js');
require('dotenv').config();

const agent = new VinnyAgent({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const categories = ['health_tip', 'fitness', 'safety', 'longevity', 'fact'];

async function testMultiple() {
  console.log('🧪 Testing Vinny - Generating 5 tweets...\n');

  const tweets = [];

  for (let i = 0; i < 5; i++) {
    const category = categories[i];
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Test ${i + 1}/5 - Category: ${category}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    try {
      const content = await agent.generateContent({
        category: category,
        recentPosts: tweets // Pass previous tweets to avoid duplicates
      });

      tweets.push(content);

      console.log(`📝 Generated: "${content}"`);
      console.log(`📏 Length: ${content.length} chars`);

      // Check for problems
      const problems = [];
      if (content.includes('.?')) problems.push('❌ HAS ".?" ENDING');
      if (content.includes('!?')) problems.push('❌ HAS "!?" ENDING');
      if (content.includes('#')) problems.push('❌ HAS HASHTAGS');
      if (content.length > 280) problems.push('❌ TOO LONG (>280 chars)');
      if (content.length > 200) problems.push('⚠️  PRETTY LONG (>200 chars)');

      if (problems.length > 0) {
        console.log('\n⚠️  PROBLEMS FOUND:');
        problems.forEach(p => console.log(`   ${p}`));
      } else {
        console.log('✅ Looks good!');
      }

    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total tweets generated: ${tweets.length}`);

  const hasQuestionMarkIssue = tweets.some(t => t.includes('.?') || t.includes('!?'));
  const hasHashtags = tweets.some(t => t.includes('#'));
  const tooLong = tweets.filter(t => t.length > 280).length;

  console.log(`\n${hasQuestionMarkIssue ? '❌' : '✅'} Question mark issue: ${hasQuestionMarkIssue ? 'FOUND ".?" or "!?"' : 'None found'}`);
  console.log(`${hasHashtags ? '❌' : '✅'} Hashtags: ${hasHashtags ? 'Found hashtags' : 'None found'}`);
  console.log(`${tooLong > 0 ? '❌' : '✅'} Length: ${tooLong > 0 ? `${tooLong} tweets too long` : 'All under 280 chars'}`);

  // Check for variety
  const openers = tweets.map(t => {
    const match = t.match(/^([A-Za-z\s,]+?)[:,-]/);
    return match ? match[1].trim() : 'No opener';
  });
  const uniqueOpeners = new Set(openers);
  console.log(`${uniqueOpeners.size === tweets.length ? '✅' : '⚠️ '} Variety: ${uniqueOpeners.size}/${tweets.length} unique openers`);

  if (hasQuestionMarkIssue) {
    console.log('\n❌ STILL HAS ".?" PROBLEM - NEED TO UPGRADE AI MODEL');
  } else {
    console.log('\n✅ READY TO DEPLOY');
  }
}

testMultiple().catch(console.error);
