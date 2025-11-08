import Anthropic from '@anthropic-ai/sdk';
import { Config, PostCategory, ContentRequest } from '../types/index.js';

export class VinnyAgent {
  private client: Anthropic;
  private readonly systemPrompt = `You are Vinny, a dog health expert. Write tweets about dog health, fitness, safety, and longevity.

Follow these examples:
- "Turmeric reduces joint inflammation by 27%. Add 1/4 tsp per 10 lbs of body weight to their food daily 🧪"
- "Chocolate contains theobromine which is toxic to dogs. Dark chocolate is most dangerous. Call your vet immediately if ingested 🚨"
- "Dogs have 300 million olfactory receptors vs 6 million in humans. This allows them to detect cancer and explosives 🧠"
- "Exercise needs: 30-60 min daily depending on breed. Include mental stimulation like puzzle feeders and scent work 🏋️"
- "Omega-3 fatty acids reduce inflammation and support brain function. Use wild-caught fish oil, 20-40mg per pound of body weight 💊"
- "Raw diets increase salmonella risk by 23x compared to commercial kibble. Stick with balanced food from reputable brands ✅"
- "Probiotics improve gut health and immune function. Studies show 40% reduction in digestive issues with daily supplementation 👀"
- "Your pup needs mental stimulation. Puzzle toys reduce destructive behavior by 35%. Try 15 min sessions daily 🧩"

Include numbers and facts. No hashtags. Keep under 280 characters`;

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
      good_morning: 'Morning post. Example: "Morning. Daily walks prevent obesity in 60% of dogs ☀️"',

      lunch: 'Dog nutrition. Example: "Blueberries contain antioxidants that improve cognition. Feed 2-3 berries per 10 lbs 🫐"',

      good_night: 'Night post about rest. Example: "Good night. Dogs need 12-14 hours of sleep for proper recovery 😴"',

      health_tip: 'Health tip with facts and numbers. Example: "Dental disease affects 80% of dogs by age 3. Brush teeth daily 🦷"',

      fitness: 'Exercise tip. Example: "Swimming builds muscle without joint stress. 15-20 min sessions 3x weekly 🏊"',

      safety: 'Safety warning. Example: "Grapes cause acute kidney failure in dogs. Even 1-2 grapes can be fatal. Call vet immediately 🚨"',

      longevity: 'Dog lifespan tip. Example: "Maintaining healthy weight increases lifespan by 1.8 years. Monitor body condition monthly 📊"',

      joke: 'Brief observation. Example: "Dogs tilt their heads to hear high frequencies better. Not because they understand your baby talk 🐕"',

      story: 'Historical or scientific fact. Example: "Laika the dog orbited Earth in 1957, paving the way for human space travel 🚀"',

      fact: 'Fact with numbers. Example: "A dog's nose print is unique like a human fingerprint 👃"',
    };

    let prompt = categoryPrompts[request.category];

    if (request.recentPosts.length > 0) {
      prompt += `\n\nRecent posts to avoid repeating:\n${request.recentPosts.slice(0, 10).join('\n')}`;
      prompt += '\n\nDon\'t repeat these topics.';
    }

    prompt += '\n\nWrite ONE tweet under 280 characters.';

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
