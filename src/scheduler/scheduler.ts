import cron from 'node-cron';
import { VinnyAgent } from '../agent/vinny.js';
import { TwitterClient } from '../twitter/client.js';
import { PostDatabase } from '../database/db.js';
import { Config, PostCategory } from '../types/index.js';

export class PostScheduler {
  private vinny: VinnyAgent;
  private twitter: TwitterClient;
  private db: PostDatabase;
  private postsPerDay: number;
  private isPosting: boolean = false;
  private timezone: string;

  // 12 posts per day: good morning, 10 regular (including lunch), good night
  private postingSchedule: Array<{ time: string; category: PostCategory | 'random' }> = [
    { time: '0 4 * * *',    category: 'good_morning' },  // 4:00 AM
    { time: '20 5 * * *',   category: 'random' },        // 5:20 AM
    { time: '40 6 * * *',   category: 'random' },        // 6:40 AM
    { time: '0 8 * * *',    category: 'random' },        // 8:00 AM
    { time: '20 9 * * *',   category: 'random' },        // 9:20 AM
    { time: '40 10 * * *',  category: 'random' },        // 10:40 AM
    { time: '0 12 * * *',   category: 'lunch' },         // 12:00 PM - Lunch post
    { time: '20 13 * * *',  category: 'random' },        // 1:20 PM
    { time: '40 14 * * *',  category: 'random' },        // 2:40 PM
    { time: '0 16 * * *',   category: 'random' },        // 4:00 PM
    { time: '20 17 * * *',  category: 'random' },        // 5:20 PM
    { time: '45 19 * * *',  category: 'good_night' },    // 7:45 PM - Good night
  ];

  constructor(config: Config, db: PostDatabase) {
    this.vinny = new VinnyAgent(config.anthropic);
    this.twitter = new TwitterClient(config.twitter);
    this.db = db;
    this.postsPerDay = 12; // Now 12 posts per day
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
    console.log(`📍 Time-based schedule (not post count)`);

    // Schedule each posting time
    this.postingSchedule.forEach((schedule, index) => {
      cron.schedule(schedule.time, async () => {
        console.log(`\n⏰ Scheduled post #${index + 1} triggered`);
        const category = schedule.category === 'random'
          ? this.vinny.getRandomCategory()
          : schedule.category;
        await this.executePost(index + 1, category);
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
    const times = [
      '4:00 AM - Good Morning',
      '5:20 AM',
      '6:40 AM',
      '8:00 AM',
      '9:20 AM',
      '10:40 AM',
      '12:00 PM - Lunch',
      '1:20 PM',
      '2:40 PM',
      '4:00 PM',
      '5:20 PM',
      '7:45 PM - Good Night'
    ];
    times.forEach((time, i) => console.log(`   ${i + 1}. ${time}`));

    console.log('\n✅ Vinny is now running! Press Ctrl+C to stop.');
  }

  private async executePost(postNumber: number, category: PostCategory): Promise<void> {
    if (this.isPosting) {
      console.log(`⏭️  Already posting, skipping this scheduled time`);
      return;
    }

    this.isPosting = true;

    try {
      console.log(`\n🎬 Generating scheduled post #${postNumber}...`);
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
