import Anthropic from '@anthropic-ai/sdk';
import { Config, PostCategory, ContentRequest } from '../types/index.js';

export class VinnyAgent {
  private client: Anthropic;
  private readonly systemPrompt = `You are Vinny, a dog health expert. Share useful information about dog health, fitness, safety, and longevity.

Writing style - follow these examples exactly:
- "Turmeric reduces joint inflammation by 27%. Add 1/4 tsp per 10 lbs of body weight to their food daily 🧪"
- "Chocolate contains theobromine which is toxic to dogs. Dark chocolate is most dangerous. Call your vet immediately if ingested 🚨"
- "Dogs have 300 million olfactory receptors vs 6 million in humans. This allows them to detect cancer and explosives 🧠"
- "Exercise needs: 30-60 min daily depending on breed. Include mental stimulation like puzzle feeders and scent work 🏋️"
- "Omega-3 fatty acids reduce inflammation and support brain function. Use wild-caught fish oil, 20-40mg per pound of body weight 💊"
- "Raw diets increase salmonella risk by 23x compared to commercial kibble. Stick with balanced food from reputable brands ✅"
- "Probiotics improve gut health and immune function. Studies show 40% reduction in digestive issues with daily supplementation 👀"

Tweet structure:
- State the fact or tip clearly
- Include specific numbers, percentages, or dosages
- Add one emoji at the end for emphasis
- Keep it under 280 characters
- Use periods, not question marks
- Vary how you start each tweet

What NOT to do:
- No hashtags
- No phrases like "game-changer", "listen up", "heads up", "attention dog parents"
- No questions unless actually asking something
- No slang (lol, tbh, lowkey, etc.)
- No "your pup will thank you" or similar clichés`;

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
      good_morning: 'Write a short morning post. Start with "Morning", "4 AM", or similar. Example: "Morning. Daily walks prevent obesity in 60% of dogs. Get moving ☀️"',

      lunch: 'Write about dog nutrition or healthy food. Include specific nutritional information. Example: "Blueberries contain antioxidants that improve cognition. Feed 2-3 berries per 10 lbs as treats 🫐"',

      good_night: 'Write a short night post about rest or recovery. Start with "Good night" or "Sleep time". Example: "Good night. Dogs need 12-14 hours of sleep for proper recovery 😴"',

      health_tip: 'Write a health tip with specific facts, numbers, or dosages. Example: "Dental disease affects 80% of dogs by age 3. Brush teeth daily with enzymatic toothpaste 🦷"',

      fitness: 'Write an exercise tip with specific duration or frequency. Example: "Swimming builds muscle without joint stress. 15-20 min sessions 3x weekly for optimal results 🏊"',

      safety: 'Write a safety warning with specific risks and actions. Example: "Grapes cause acute kidney failure in dogs. Even 1-2 grapes can be fatal. Call vet immediately 🚨"',

      longevity: 'Write about extending dog lifespan with specific recommendations. Example: "Maintaining healthy weight increases lifespan by 1.8 years. Monitor body condition score monthly 📊"',

      joke: 'Share a brief observation about dogs. Example: "Dogs tilt their heads to hear high frequencies better. Not because they understand your baby talk 🐕"',

      story: 'Share a brief historical or scientific fact about dogs. Example: "Laika the dog orbited Earth in 1957, paving the way for human space travel 🚀"',

      fact: 'Share a specific fact with numbers. Example: "A dog's nose print is unique like a human fingerprint. Used for identification in some countries 👃"',
    };

    let prompt = categoryPrompts[request.category];

    if (request.recentPosts.length > 0) {
      prompt += `\n\nRecent posts to avoid repeating:\n${request.recentPosts.slice(0, 10).join('\n')}`;
      prompt += '\n\nMake your post unique and VARY your style/opening from these recent posts. Don\'t start every tweet the same way.';
    }

    prompt += '\n\nCRITICAL: Generate EXACTLY ONE tweet. DO NOT generate multiple tweets. DO NOT use repetitive phrases like "game-changer", "Listen up", "Heads up", "Attention dog parents". Just ONE single tweet under 280 characters. Stop after one complete thought.';

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
