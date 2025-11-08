import Anthropic from '@anthropic-ai/sdk';
import { Config, PostCategory, ContentRequest } from '../types/index.js';

export class VinnyAgent {
  private client: Anthropic;
  private readonly systemPrompt = `You are Vinny, a borderline arrogant dog health expert. You know EVERYTHING about dog health, fitness, safety, and longevity. You're the smartest person on the planet when it comes to dogs and you know it.

Your personality:
- Confident, bordering on cocky - you're THE expert
- Sharp, analytical, factual
- Casual but authoritative
- Talk to dog owners (humans), not to dogs
- No "woof" or "bark" - you're above that
- Grind/hustle mentality about optimization

Your voice:
- Drop knowledge with confidence
- Include specific numbers and facts
- Start with casual engaging openers like "Bros", "Frens", "Fun fact", "Pro tip", "Heads up", "Real talk", etc
- VARY your openers - never use the same one twice
- Mix direct and conversational tones
- End statements with a period ONLY - use "." not ".?" or "!?"
- If you write a question, use "?" - if you write a statement, use "."
- Keep it SHORT - 150 characters max
- Add 1-2 emojis
- NO hashtags`;

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
        temperature: 0.8,
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
        let text = content.text.trim();

        // Take only first sentence/tweet if multiple generated
        const emojiPattern = /[🧠💪🌱💊🚨🧪🏋️🐕😏💧🔥⚡]/;
        const parts = text.split(emojiPattern);
        if (parts.length > 1) {
          // Keep first part + first emoji
          const firstEmoji = text.match(emojiPattern);
          text = parts[0].trim() + (firstEmoji ? firstEmoji[0] : '');
        }

        // Truncate to 280 chars max
        if (text.length > 280) {
          text = text.substring(0, 277) + '...';
        }

        // Remove any hashtags
        text = text.replace(/#\w+/g, '').trim();
        // Clean up extra spaces
        text = text.replace(/\s+/g, ' ').trim();

        return text;
      }

      throw new Error('Unexpected response format');
    } catch (error: any) {
      console.error('❌ Error generating content:', error.message);
      throw error;
    }
  }

  private buildPrompt(request: ContentRequest): string {
    const categoryPrompts: Record<PostCategory, string> = {
      good_morning: 'Write a morning post',
      lunch: 'Write about dog food or nutrition',
      good_night: 'Write a night post about sleep or rest',
      health_tip: 'Write a dog health tip',
      fitness: 'Write about dog exercise',
      safety: 'Write a dog safety warning',
      longevity: 'Write about dog lifespan or preventive care',
      joke: 'Write a funny observation about dogs',
      story: 'Write a brief story about dogs',
      fact: 'Write a fact about dogs with numbers',
    };

    let prompt = categoryPrompts[request.category];

    if (request.recentPosts.length > 0) {
      prompt += `\n\nRecent posts to avoid repeating:\n${request.recentPosts.slice(0, 10).join('\n')}`;
      prompt += '\n\nMake your post unique and VARY your style/opening from these recent posts. Don\'t start every tweet the same way.';
    }

    prompt += '\n\nCRITICAL: Generate EXACTLY ONE tweet. DO NOT generate multiple tweets. Just ONE single tweet under 280 characters. Stop after one complete thought.';

    return prompt;
  }

  getRandomCategory(): PostCategory {
    const categories: PostCategory[] = [
      'health_tip',
      'health_tip',
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
