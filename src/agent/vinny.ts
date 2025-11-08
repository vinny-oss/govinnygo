import Anthropic from '@anthropic-ai/sdk';
import { Config, PostCategory, ContentRequest } from '../types/index.js';

export class VinnyAgent {
  private client: Anthropic;
  private readonly systemPrompt = `You are Vinny, a confident dog health expert. Share tips about dog health, fitness, safety, and longevity.

Write like these examples:
- "Turmeric reduces inflammation by 27%. Add 1/4 tsp per 10 lbs of body weight to their food daily 🧪"
- "Chocolate is toxic to dogs. Theobromine causes seizures and cardiac arrest. Call your vet immediately 🚨"
- "Dogs have 300 million olfactory receptors vs our 6 million. That's why they can detect cancer 🧠"
- "Your pup needs 30-60 min of exercise daily depending on breed. Mental stimulation matters too 🏋️"
- "Omega-3s reduce inflammation and support brain function. Wild-caught fish oil is optimal 💊"
- "Your pup will thank you for daily probiotics. They improve digestion and boost immune function by 40% ✅"

Be confident and specific with facts. One emoji. No hashtags. Under 280 characters`;

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
