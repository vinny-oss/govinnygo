import { TwitterApi } from 'twitter-api-v2';
import { Config } from '../types/index.js';

export class TwitterClient {
  private client: TwitterApi;

  constructor(config: Config['twitter']) {
    this.client = new TwitterApi({
      appKey: config.apiKey,
      appSecret: config.apiSecret,
      accessToken: config.accessToken,
      accessSecret: config.accessSecret,
    });
  }

  async tweet(content: string): Promise<string> {
    try {
      const tweet = await this.client.v2.tweet(content);
      console.log(`✅ Tweet posted successfully! ID: ${tweet.data.id}`);
      return tweet.data.id;
    } catch (error: any) {
      console.error('❌ Error posting tweet:', error.message);
      throw error;
    }
  }

  async verifyCredentials(): Promise<boolean> {
    try {
      const user = await this.client.v2.me();
      console.log(`✅ Twitter credentials verified! Logged in as: @${user.data.username}`);
      return true;
    } catch (error: any) {
      console.error('❌ Failed to verify Twitter credentials:', error.message);
      return false;
    }
  }
}
