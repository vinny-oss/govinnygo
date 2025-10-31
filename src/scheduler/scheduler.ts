import cron from 'node-cron';
import { VinnyAgent } from '../agent/vinny.js';
import { TwitterClient } from '../twitter/client.js';
import { PostDatabase } from '../database/db.js';
import { Config } from '../types/index.js';

export class PostScheduler {
  private vinny: VinnyAgent;
  private twitter: TwitterClient;
  private db: PostDatabase;
  private postsPerDay: number;
  private isPosting: boolean = false;
  private timezone: string;
  private activeStartHour: number = 4; // 4 AM
  private activeEndHour: number = 20; // 8 PM

  constructor(config: Config, db: PostDatabase) {
    this.vinny = new VinnyAgent(config.anthropic);
    this.twitter = new TwitterClient(config.twitter);
    this.db = db;
    this.postsPerDay = config.postsPerDay;
    this.timezone = config.timezone;
  }

  private isActiveHours(): boolean {
    const now = new Date().toLocaleString('en-US', { timeZone: this.timezone });
    const currentHour = new Date(now).getHours();
    return currentHour >= this.activeStartHour && currentHour < this.activeEndHour;
  }

  async start(): Promise<void> {
    console.log('🐕 Starting Vinny the Chihuahua Agent...');

    // Verify Twitter credentials
    const isVerified = await this.twitter.verifyCredentials();
    if (!isVerified) {
      throw new Error('Failed to verify Twitter credentials. Please check your .env file.');
    }

    console.log(`📅 Scheduling ${this.postsPerDay} posts per day`);
    console.log(`🌍 Timezone: ${this.timezone}`);
    console.log(`⏰ Active hours: ${this.activeStartHour}:00 AM - ${this.activeEndHour}:00 PM`);

    // Calculate interval between posts (16 hours = 960 minutes for 10 posts = 96 min intervals)
    const activeHours = this.activeEndHour - this.activeStartHour;
    const minutesBetweenPosts = Math.floor((activeHours * 60) / this.postsPerDay);
    console.log(`⏰ Posting every ${minutesBetweenPosts} minutes during active hours`);

    // Run every hour and check if we should post
    // This checks every hour on the hour, but only posts during active hours at proper intervals
    cron.schedule('*/30 * * * *', async () => {
      await this.executePost();
    }, {
      timezone: this.timezone
    });

    // Check if we should post immediately on startup
    const todayCount = this.db.getTodayPostCount();
    if (todayCount < this.postsPerDay && this.isActiveHours()) {
      console.log('🚀 Posting initial tweet...');
      await this.executePost();
    } else if (todayCount >= this.postsPerDay) {
      console.log(`✅ Already posted ${todayCount} times today. Waiting for tomorrow at ${this.activeStartHour}:00 AM.`);
    } else {
      const now = new Date().toLocaleString('en-US', { timeZone: this.timezone });
      const currentHour = new Date(now).getHours();
      console.log(`💤 Outside active hours (currently ${currentHour}:00). Waiting until ${this.activeStartHour}:00 AM to start posting.`);
    }

    console.log('✅ Vinny is now running! Press Ctrl+C to stop.');
  }

  private async executePost(): Promise<void> {
    if (this.isPosting) {
      return; // Prevent concurrent posts
    }

    // Check if we're in active hours
    if (!this.isActiveHours()) {
      return; // Silently skip if outside active hours
    }

    this.isPosting = true;

    try {
      // Check if we've already hit the daily limit
      const todayCount = this.db.getTodayPostCount();
      if (todayCount >= this.postsPerDay) {
        this.isPosting = false;
        return;
      }

      console.log(`\n🎬 Generating post ${todayCount + 1}/${this.postsPerDay} for today...`);

      // Get random category
      const category = this.vinny.getRandomCategory();
      console.log(`📝 Category: ${category}`);

      // Get recent posts to avoid repetition
      const recentPosts = this.db.getRecentPosts(20);
      const recentContent = recentPosts.map(p => p.content);

      // Generate content
      const content = await this.vinny.generateContent({
        category,
        recentPosts: recentContent,
      });

      console.log(`💬 Generated: "${content}"`);

      // Post to Twitter
      await this.twitter.tweet(content);

      // Save to database
      this.db.savePost({
        content,
        postedAt: new Date().toISOString(),
        category,
        success: true,
      });

      console.log(`✅ Post ${todayCount + 1}/${this.postsPerDay} completed!`);
    } catch (error: any) {
      console.error('❌ Failed to execute post:', error.message);

      // Save failed post to database
      this.db.savePost({
        content: 'Failed to generate',
        postedAt: new Date().toISOString(),
        category: 'health_tip',
        success: false,
      });
    } finally {
      this.isPosting = false;
    }
  }

  stop(): void {
    this.isPosting = false;
    this.db.close();
    console.log('🛑 Vinny has been stopped.');
  }
}
