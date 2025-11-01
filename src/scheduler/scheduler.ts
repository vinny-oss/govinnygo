import cron, { ScheduledTask } from 'node-cron';
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
  private cronTask: ScheduledTask | null = null;

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
    this.cronTask = cron.schedule('*/30 * * * *', async () => {
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

  async executePost(): Promise<{ success: boolean; content?: string; error?: string }> {
    if (this.isPosting) {
      return { success: false, error: 'Already posting' };
    }

    // Check if we're in active hours
    if (!this.isActiveHours()) {
      return { success: false, error: 'Outside active hours' };
    }

    this.isPosting = true;

    try {
      // Check if we've already hit the daily limit
      const todayCount = this.db.getTodayPostCount();
      if (todayCount >= this.postsPerDay) {
        this.isPosting = false;
        return { success: false, error: 'Daily limit reached' };
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

      this.isPosting = false;
      return { success: true, content };
    } catch (error: any) {
      console.error('❌ Failed to execute post:', error.message);

      // Save failed post to database
      this.db.savePost({
        content: 'Failed to generate',
        postedAt: new Date().toISOString(),
        category: 'health_tip',
        success: false,
      });

      this.isPosting = false;
      return { success: false, error: error.message };
    }
  }

  stop(): void {
    this.isPosting = false;
    if (this.cronTask) {
      this.cronTask.stop();
      this.cronTask = null;
    }
    console.log('🛑 Vinny has been stopped.');
  }
}
