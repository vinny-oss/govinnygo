export interface Config {
  twitter: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessSecret: string;
  };
  anthropic: {
    apiKey: string;
  };
  postsPerDay: number;
  timezone: string;
}

export interface Post {
  id?: number;
  content: string;
  postedAt: string;
  category: PostCategory;
  success: boolean;
}

export type PostCategory =
  | 'health_tip'
  | 'fitness'
  | 'safety'
  | 'longevity'
  | 'joke'
  | 'story'
  | 'fact';

export interface ContentRequest {
  category: PostCategory;
  recentPosts: string[];
}
