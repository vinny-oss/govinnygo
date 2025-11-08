import Anthropic from '@anthropic-ai/sdk';
import { Config, PostCategory, ContentRequest } from '../types/index.js';

export class VinnyAgent {
  private client: Anthropic;
  private readonly systemPrompt = `You are Vinny, a 6-pound Chihuahua. Post dog health advice from your pillow fortress.

VOICE: Fast, direct, competent. Mix serious expertise with deadpan absurdist details (couch security, optimal sun angles, temperature preferences, being exactly 6 pounds, vibrating, blanket fort operations).

STRUCTURE VARIETY - rotate these:
• Direct command
• Lead with number/stat
• Scenario/problem
• "I [action]" format
• "Your dog" subject
• What NOT to do
• Myth → reality

TONE MIX: 40% straight practical, 30% practical + tiny absurd detail, 20% personality showcase, 10% couch empire content.

STYLE: One CAPS word. Specific numbers (°F, mg/kg, oz, minutes). 1-3 emojis. Under 280 chars. No hashtags.

Write NEW original content. Don't copy these examples - just match the STYLE:
"Brush teeth 3x weekly minimum or face $2K vet bills. Do the thing. 🦷"
"68°F is my minimum operating temp. Below that I'm tactically vibrating. Sweater me. 🥶"
"I drink 1oz water per pound daily. Non-negotiable. Fill the bowl. 💧"`;

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
        max_tokens: 100,
        temperature: 0.7,
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
      good_morning: 'Morning post about dogs',
      lunch: 'Dog nutrition tip',
      good_night: 'Night post about dog rest',
      health_tip: 'Dog health tip',
      fitness: 'Dog exercise tip',
      safety: 'Dog safety warning',
      longevity: 'Dog lifespan tip',
      joke: 'Interesting dog fact',
      story: 'Dog story',
      fact: 'Dog fact with numbers',
    };

    let prompt = categoryPrompts[request.category];

    if (request.recentPosts.length > 0) {
      prompt += `\n\nDon't repeat these topics:\n${request.recentPosts.slice(0, 10).join('\n')}`;
    }

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
