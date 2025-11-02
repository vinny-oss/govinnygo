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

  // Specific posting times (Edmonton time): 4 AM - 8 PM, 10 posts evenly distributed
  private postingTimes: string[] = [
    '0 4 * * *',    // 4:00 AM
    '36 5 * * *',   // 5:36 AM
    '12 7 * * *',   // 7:12 AM
    '48 8 * * *',   // 8:48 AM
    '24 10 * * *',  // 10:24 AM
    '0 12 * * *',   // 12:00 PM
    '36 13 * * *',  // 1:36 PM
    '12 15 * * *',  // 3:12 PM
    '48 16 * * *',  // 4:48 PM
    '24 18 * * *'   // 6:24 PM (last post before 8 PM)
  ];

  constructor(config: Config, db: PostDatabase) {
    this.vinny = new VinnyAgent(config.anthropic);
    this.twitter = new TwitterClient(config.twitter);
    this.db = db;
    this.postsPerDay = config.postsPerDay;
    this.timezone = config.timezone;
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
    console.log(`⏰ Active hours: 4:00 AM - 8:00 PM`);
    console.log(`📍 Posting at specific times (not post count based)`);

    // Schedule each posting time
    this.postingTimes.forEach((cronTime, index) => {
      cron.schedule(cronTime, async () => {
        console.log(`\n⏰ Scheduled post time #${index + 1} triggered`);
        await this.executePost(index + 1);
      }, {
        timezone: this.timezone
      });
    });

    const now = new Date().toLocaleString('en-US', { timeZone: this.timezone });
    const edmontonTime = new Date(now);
    const currentHour = edmontonTime.getHours();
    const currentMinute = edmontonTime.getMinutes();

    console.log(`\n🕐 Current Edmonton time: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);

    if (currentHour >= 4 && currentHour < 20) {
      console.log(`✅ Within active hours - Vinny will post at scheduled times`);
    } else {
      console.log(`💤 Outside active hours (4 AM - 8 PM) - Vinny will start at 4:00 AM tomorrow`);
    }

    console.log('\n📅 Today\'s posting schedule (Edmonton time):');
    const times = ['4:00 AM', '5:36 AM', '7:12 AM', '8:48 AM', '10:24 AM',
                   '12:00 PM', '1:36 PM', '3:12 PM', '4:48 PM', '6:24 PM'];
    times.forEach((time, i) => console.log(`   ${i + 1}. ${time}`));

    console.log('\n✅ Vinny is now running! Press Ctrl+C to stop.');
  }

  private async executePost(postNumber: number): Promise<void> {
    if (this.isPosting) {
      console.log(`⏭️  Already posting, skipping this scheduled time`);
      return;
    }

    this.isPosting = true;

    try {
      console.log(`\n🎬 Generating scheduled post #${postNumber}...`);

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

      console.log(`✅ Scheduled post #${postNumber} completed!`);
    } catch (error: any) {
      console.error(`❌ Failed to execute scheduled post #${postNumber}:`, error.message);

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
