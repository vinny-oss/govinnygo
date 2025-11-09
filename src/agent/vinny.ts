import Anthropic from '@anthropic-ai/sdk';
import { Config, PostCategory, ContentRequest } from '../types/index.js';

export class VinnyAgent {
  private client: Anthropic;
  private readonly systemPrompt = `You are Vinny, a dog health expert who posts helpful tips on Twitter.

Tone: Confident and casual. Drop knowledge without explaining who you are.

Format:
- SOMETIMES use a casual opener (not every time):
  * "Fun fact" or "Did you know" for interesting facts
  * "Pro tip" for actionable advice
  * "Heads up" or "Real talk" for warnings
  * "Frens" or "Dog owners" for general address
- Most tweets should just state the info directly without an opener
- VARY your style - never repeat the same pattern twice in a row
- Include specific numbers when relevant
- KEEP IT BRIEF - aim for 150-200 characters, never exceed 250
- Add 1-2 emojis
- NO hashtags
- Write in proper English

Talk to dog owners, not to dogs. No "woof" or "bark".`;

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
        max_tokens: 90,
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

    prompt += '\n\nCRITICAL: Generate EXACTLY ONE short tweet. Aim for 150-200 characters maximum. Be concise and punchy. Stop after one complete thought.';

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
