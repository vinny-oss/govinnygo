import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { BotController } from './bot-controller.js';
import { PostDatabase } from '../database/db.js';
import { config } from '../config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const botController = new BotController();
const db = new PostDatabase();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

// CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next();
});

// API Routes

// Get bot status and statistics
app.get('/api/status', async (req: Request, res: Response) => {
  try {
    const status = await botController.getStatus();
    const todayCount = db.getTodayPostCount();
    const recentPosts = db.getRecentPosts(5);

    res.json({
      ...status,
      todayPostCount: todayCount,
      postsPerDay: config.postsPerDay,
      recentPosts: recentPosts,
      timezone: config.timezone,
    });
  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// Start the bot
app.post('/api/start', async (req: Request, res: Response) => {
  try {
    const result = await botController.start();
    res.json(result);
  } catch (error) {
    console.error('Error starting bot:', error);
    res.status(500).json({ error: 'Failed to start bot' });
  }
});

// Stop the bot
app.post('/api/stop', async (req: Request, res: Response) => {
  try {
    const result = await botController.stop();
    res.json(result);
  } catch (error) {
    console.error('Error stopping bot:', error);
    res.status(500).json({ error: 'Failed to stop bot' });
  }
});

// Get post history with pagination
app.get('/api/posts', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const category = req.query.category as string;

    let posts;
    if (category && category !== 'all') {
      posts = db.getPostsByCategory(category);
    } else {
      posts = db.getRecentPosts(limit);
    }

    res.json({ posts, count: posts.length });
  } catch (error) {
    console.error('Error getting posts:', error);
    res.status(500).json({ error: 'Failed to get posts' });
  }
});

// Get current configuration
app.get('/api/config', async (req: Request, res: Response) => {
  try {
    const currentConfig = {
      postsPerDay: config.postsPerDay,
      timezone: config.timezone,
      twitterConfigured: !!(config.twitter.apiKey && config.twitter.apiSecret),
      anthropicConfigured: !!config.anthropic.apiKey,
    };

    res.json(currentConfig);
  } catch (error) {
    console.error('Error getting config:', error);
    res.status(500).json({ error: 'Failed to get config' });
  }
});

// Update configuration
app.put('/api/config', async (req: Request, res: Response) => {
  try {
    const { postsPerDay, timezone } = req.body;

    // Validate inputs
    if (postsPerDay && (postsPerDay < 1 || postsPerDay > 50)) {
      return res.status(400).json({ error: 'Posts per day must be between 1 and 50' });
    }

    // Update config (in production, you'd persist this to .env or database)
    if (postsPerDay) {
      (config as any).postsPerDay = postsPerDay;
    }
    if (timezone) {
      (config as any).timezone = timezone;
    }

    // Restart bot with new config
    await botController.restart();

    res.json({ success: true, message: 'Configuration updated and bot restarted' });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ error: 'Failed to update config' });
  }
});

// Get statistics
app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    const todayCount = db.getTodayPostCount();
    const allPosts = db.getRecentPosts(1000); // Get a large number for stats

    // Calculate stats by category
    const categoryStats = allPosts.reduce((acc, post) => {
      acc[post.category] = (acc[post.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      totalPosts: allPosts.length,
      todayPosts: todayCount,
      categoryBreakdown: categoryStats,
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Test post generation (preview without posting)
app.post('/api/test-post', async (req: Request, res: Response) => {
  try {
    const preview = await botController.generatePreview();
    res.json(preview);
  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});

// Manual post trigger
app.post('/api/post-now', async (req: Request, res: Response) => {
  try {
    const result = await botController.postNow();
    res.json(result);
  } catch (error) {
    console.error('Error posting:', error);
    res.status(500).json({ error: 'Failed to post' });
  }
});

// List agents (future-proofing for multi-agent support)
app.get('/api/agents', async (req: Request, res: Response) => {
  try {
    const agents = await botController.getAgents();
    res.json({ agents });
  } catch (error) {
    console.error('Error getting agents:', error);
    res.status(500).json({ error: 'Failed to get agents' });
  }
});

// Serve the dashboard
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

export function startServer() {
  return new Promise<void>((resolve) => {
    app.listen(PORT, () => {
      console.log(`🎮 Vinny Command Center running at http://localhost:${PORT}`);
      console.log(`📊 Dashboard: http://localhost:${PORT}`);
      console.log(`🔌 API: http://localhost:${PORT}/api/*`);
      resolve();
    });
  });
}

export { app };
