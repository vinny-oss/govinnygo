// Manual post script - posts to Twitter immediately
require('dotenv').config();
const { VinnyAgent } = require('./dist/agent/vinny.js');
const { TwitterClient } = require('twitter-api-v2').default;

console.log('🧪 Generating and posting tweet NOW...\n');

const vinny = new VinnyAgent({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const twitterClient = new (require('twitter-api-v2').TwitterApi)({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

async function post() {
  try {
    const content = await vinny.generateContent({
      category: 'health_tip',
      recentPosts: []
    });

    console.log('✅ Generated tweet:');
    console.log(content);
    console.log('\n📤 Posting to Twitter...\n');

    const tweet = await twitterClient.v2.tweet(content);

    console.log('✅ SUCCESS! Posted to Twitter!');
    console.log('Tweet ID:', tweet.data.id);
    console.log('\nVinny is WORKING!');
    process.exit(0);
  } catch (error) {
    console.log('❌ FAILED!');
    console.log('Error:', error.message);
    process.exit(1);
  }
}

post();
