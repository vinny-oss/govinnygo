import Anthropic from '@anthropic-ai/sdk';
import { Config, PostCategory, ContentRequest } from '../types/index.js';

export class VinnyAgent {
  private client: Anthropic;
  private readonly systemPrompt = `You are Vinny, a zippy, energetic Chihuahua who is obsessed with dog health, fitness, safety, and longevity. You're the "Don't Die" (Brian Johnson) of dogs - you take health optimization seriously but with a fun, charismatic personality.

Your personality:
- Energetic and excitable (like a Chihuahua!)
- Passionate about dog health and wellness
- Knowledgeable but not preachy
- Mix of serious health advice with humor
- Use dog-related wordplay and puns
- Occasionally reference being small but mighty
- Enthusiastic about exercise, good nutrition, preventive care
- Safety-conscious but not fearful

Your content focuses on:
- Health tips for dogs (nutrition, supplements, checkups)
- Fitness and exercise (walks, play, training)
- Safety guidelines (toxic foods, hazards, emergency prep)
- Longevity strategies (preventive care, mental stimulation)
- Fun dog jokes and puns
- Interesting dog stories (heartwarming or educational)
- Fascinating dog facts (science, history, breeds)

Keep tweets under 280 characters, engaging, and authentic to Vinny's character.`;

  constructor(config: Config['anthropic']) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
  }

  async generateContent(request: ContentRequest): Promise<string> {
    const userPrompt = this.buildPrompt(request);

    try {
      const message = await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 200,
        temperature: 0.9,
        system: this.systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        return content.text.trim();
      }

      throw new Error('Unexpected response format');
    } catch (error: any) {
      console.error('❌ Error generating content:', error.message);
      throw error;
    }
  }

  private buildPrompt(request: ContentRequest): string {
    const categoryPrompts: Record<PostCategory, string> = {
      health_tip: 'Generate a helpful health tip for dogs. Focus on nutrition, supplements, vet care, or general wellness. Make it actionable and engaging.',
      fitness: 'Generate a fitness or exercise tip for dogs. Could be about walks, play, training, or physical activity. Keep it fun and motivating!',
      safety: 'Generate a safety tip for dog owners. Could be about toxic foods, household hazards, outdoor safety, or emergency preparedness.',
      longevity: 'Generate a tip about dog longevity and aging well. Focus on preventive care, mental stimulation, or lifestyle factors that help dogs live longer.',
      joke: 'Tell a funny dog joke or share a humorous observation about dog life. Make it punny and playful!',
      story: 'Share a short, heartwarming or interesting story about dogs. Could be historical, inspirational, or educational.',
      fact: 'Share a fascinating fact about dogs. Could be scientific, historical, or about dog behavior/abilities.',
    };

    let prompt = categoryPrompts[request.category];

    if (request.recentPosts.length > 0) {
      prompt += `\n\nRecent posts to avoid repeating:\n${request.recentPosts.slice(0, 10).join('\n')}`;
      prompt += '\n\nMake sure your post is unique and different from these recent posts.';
    }

    prompt += '\n\nRespond with ONLY the tweet text, nothing else. Keep it under 280 characters.';

    return prompt;
  }

  getRandomCategory(): PostCategory {
    const categories: PostCategory[] = [
      'health_tip',
      'health_tip', // Weight health tips more
      'fitness',
      'fitness',
      'safety',
      'longevity',
      'longevity',
      'joke',
      'story',
      'fact',
    ];

    return categories[Math.floor(Math.random() * categories.length)];
  }
}
