import Database from 'better-sqlite3';
import { Post } from '../types/index.js';

export class PostDatabase {
  private db: Database.Database;

  constructor(dbPath: string = './vinny.db') {
    this.db = new Database(dbPath);
    this.initialize();
  }

  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        posted_at TEXT NOT NULL,
        category TEXT NOT NULL,
        success INTEGER NOT NULL DEFAULT 1
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_posted_at ON posts(posted_at);
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_category ON posts(category);
    `);
  }

  savePost(post: Omit<Post, 'id'>): number {
    const stmt = this.db.prepare(`
      INSERT INTO posts (content, posted_at, category, success)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      post.content,
      post.postedAt,
      post.category,
      post.success ? 1 : 0
    );

    return result.lastInsertRowid as number;
  }

  getRecentPosts(limit: number = 50): Post[] {
    const stmt = this.db.prepare(`
      SELECT id, content, posted_at as postedAt, category, success
      FROM posts
      WHERE success = 1
      ORDER BY posted_at DESC
      LIMIT ?
    `);

    const rows = stmt.all(limit) as any[];
    return rows.map(row => ({
      ...row,
      success: row.success === 1,
    }));
  }

  getTodayPostCount(): number {
    const today = new Date().toISOString().split('T')[0];
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM posts
      WHERE posted_at LIKE ? AND success = 1
    `);

    const result = stmt.get(`${today}%`) as { count: number };
    return result.count;
  }

  getPostsByCategory(category: string, limit: number = 20): Post[] {
    const stmt = this.db.prepare(`
      SELECT id, content, posted_at as postedAt, category, success
      FROM posts
      WHERE category = ? AND success = 1
      ORDER BY posted_at DESC
      LIMIT ?
    `);

    const rows = stmt.all(category, limit) as any[];
    return rows.map(row => ({
      ...row,
      success: row.success === 1,
    }));
  }

  close(): void {
    this.db.close();
  }
}

// Export as Database for backward compatibility
export { PostDatabase as Database };
