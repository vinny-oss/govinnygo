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

  constructor(config: Config, db: PostDatabase) {
    this.vinny = new VinnyAgent(config.anthropic);
    this.twitter = new TwitterClient(config.twitter);
    this.db = db;
    this.postsPerDay = config.postsPerDay;
  }

  async start(): Promise<void> {
    console.log('🐕 Starting Vinny the Chihuahua Agent...');

    // Verify Twitter credentials
    const isVerified = await this.twitter.verifyCredentials();
    if (!isVerified) {
      throw new Error('Failed to verify Twitter credentials. Please check your .env file.');
    }

    console.log(`📅 Scheduling ${this.postsPerDay} posts per day`);

    // Calculate interval between posts
    // Spread posts evenly throughout the day (e.g., every 2.4 hours for 10 posts)
    const minutesBetweenPosts = Math.floor((24 * 60) / this.postsPerDay);
    console.log(`⏰ Posting every ${minutesBetweenPosts} minutes`);

    // Create cron expression for posting interval
    const cronExpression = `*/${minutesBetweenPosts} * * * *`;

    // Schedule posts
    cron.schedule(cronExpression, async () => {
      await this.executePost();
    });

    // Post immediately on startup if we haven't hit today's limit
    const todayCount = this.db.getTodayPostCount();
    if (todayCount < this.postsPerDay) {
      console.log('🚀 Posting initial tweet...');
      await this.executePost();
    } else {
      console.log(`✅ Already posted ${todayCount} times today. Waiting for next scheduled post.`);
    }

    console.log('✅ Vinny is now running! Press Ctrl+C to stop.');
  }

  private async executePost(): Promise<void> {
    if (this.isPosting) {
      return; // Prevent concurrent posts
    }

    this.isPosting = true;

    try {
      // Check if we've already hit the daily limit
      const todayCount = this.db.getTodayPostCount();
      if (todayCount >= this.postsPerDay) {
        console.log(`⏸️  Daily limit reached (${this.postsPerDay} posts). Skipping this interval.`);
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
