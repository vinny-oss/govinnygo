import { PostScheduler } from '../scheduler/scheduler';
import { VinnyAgent } from '../agent/vinny';
import { PostDatabase } from '../database/db';
import { config } from '../config/config';

interface BotStatus {
  running: boolean;
  uptime: number;
  lastPost: string | null;
  nextPostEstimate: string | null;
  activeHours: string;
}

interface Agent {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  postsToday: number;
  totalPosts: number;
}

export class BotController {
  private scheduler: PostScheduler | null = null;
  private startTime: Date | null = null;
  private db: PostDatabase;

  constructor() {
    this.db = new PostDatabase();
  }

  async getStatus(): Promise<BotStatus> {
    const recentPosts = this.db.getRecentPosts(1);
    const lastPost = recentPosts.length > 0 ? recentPosts[0].postedAt : null;

    return {
      running: this.scheduler !== null,
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
      lastPost,
      nextPostEstimate: this.estimateNextPost(),
      activeHours: '4 AM - 8 PM Edmonton Time',
    };
  }

  async start(): Promise<{ success: boolean; message: string }> {
    if (this.scheduler) {
      return {
        success: false,
        message: 'Bot is already running',
      };
    }

    try {
      this.scheduler = new PostScheduler(config, this.db);
      await this.scheduler.start();
      this.startTime = new Date();

      return {
        success: true,
        message: 'Bot started successfully',
      };
    } catch (error) {
      console.error('Failed to start bot:', error);
      this.scheduler = null;
      this.startTime = null;

      return {
        success: false,
        message: `Failed to start bot: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async stop(): Promise<{ success: boolean; message: string }> {
    if (!this.scheduler) {
      return {
        success: false,
        message: 'Bot is not running',
      };
    }

    try {
      this.scheduler.stop();
      this.scheduler = null;
      this.startTime = null;

      return {
        success: true,
        message: 'Bot stopped successfully',
      };
    } catch (error) {
      console.error('Failed to stop bot:', error);

      return {
        success: false,
        message: `Failed to stop bot: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async restart(): Promise<{ success: boolean; message: string }> {
    const stopResult = await this.stop();
    if (!stopResult.success && this.scheduler !== null) {
      return stopResult;
    }

    // Wait a moment before restarting
    await new Promise(resolve => setTimeout(resolve, 1000));

    return await this.start();
  }

  async generatePreview(): Promise<{ content: string; category: string }> {
    const agent = new VinnyAgent(config.anthropic);
    const recentPosts = this.db.getRecentPosts(20);

    // Random category
    const categories = ['health_tip', 'fitness', 'safety', 'longevity', 'joke', 'story', 'fact'];
    const category = categories[Math.floor(Math.random() * categories.length)] as any;

    const content = await agent.generateContent({
      category,
      recentPosts: recentPosts.map(p => p.content),
    });

    return { content, category };
  }

  async postNow(): Promise<{ success: boolean; message: string; content?: string }> {
    if (!this.scheduler) {
      return {
        success: false,
        message: 'Bot is not running. Start the bot first.',
      };
    }

    try {
      const todayCount = this.db.getTodayPostCount();

      if (todayCount >= config.postsPerDay) {
        return {
          success: false,
          message: `Daily limit reached (${config.postsPerDay} posts)`,
        };
      }

      // Execute a post immediately
      const result = await this.scheduler.executePost();

      if (result.success) {
        return {
          success: true,
          message: 'Posted successfully',
          content: result.content,
        };
      } else {
        return {
          success: false,
          message: result.error || 'Failed to post',
        };
      }
    } catch (error) {
      console.error('Error posting now:', error);
      return {
        success: false,
        message: `Failed to post: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async getAgents(): Promise<Agent[]> {
    const recentPosts = this.db.getRecentPosts(1000);
    const todayCount = this.db.getTodayPostCount();

    // Currently only Vinny, but structured for future multi-agent support
    return [
      {
        id: 'vinny',
        name: 'Vinny the Health Dog',
        status: this.scheduler ? 'active' : 'inactive',
        postsToday: todayCount,
        totalPosts: recentPosts.length,
      },
    ];
  }

  private estimateNextPost(): string | null {
    if (!this.scheduler) {
      return null;
    }

    const now = new Date();
    const edmontonTime = new Date(now.toLocaleString('en-US', { timeZone: config.timezone }));
    const currentHour = edmontonTime.getHours();

    // Check if we're in active hours (4 AM - 8 PM)
    if (currentHour < 4) {
      const next = new Date(edmontonTime);
      next.setHours(4, 0, 0, 0);
      return next.toISOString();
    } else if (currentHour >= 20) {
      const next = new Date(edmontonTime);
      next.setDate(next.getDate() + 1);
      next.setHours(4, 0, 0, 0);
      return next.toISOString();
    }

    // We're in active hours, check every 30 minutes
    const next = new Date(now);
    next.setMinutes(Math.ceil(next.getMinutes() / 30) * 30, 0, 0);
    return next.toISOString();
  }
}
