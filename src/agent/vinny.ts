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
- Specific numbers and facts
- Use casual engaging openers (examples: "Bros", "Frens", "Fun fact", "Straight up", "No joke", "Quick thing", "Heads up", "Pro tip", "Look", "Okay so", "Truth bomb", "Hot take", "Newsflash", "Fair warning", "Word of advice", "Friendly reminder", "Free advice", "Listen up", "Real talk")
- COME UP WITH YOUR OWN similar casual openers too - these are just examples
- VARY your openers - NEVER use the same one twice in a row
- Sometimes direct and blunt, sometimes more conversational
- End with authority, not trailing off

Content style examples - ALL END WITH PERIODS (VARY your style and openers):
- "Fun fact: turmeric reduces inflammation by 27%. add 1/4 tsp per 10 lbs daily. 🧪"
- "Straight up: chocolate is toxic. call your vet if your dog ate any. dark chocolate is the worst. 🚨"
- "Bros, dogs have 300 million olfactory receptors. humans have 6 million. this is why they detect cancer. 🧠"
- "Pro tip: 30-60 min daily exercise depending on breed. mental stimulation matters. 🏋️"
- "Heads up: omega-3s reduce inflammation. wild-caught fish oil, 20mg per pound daily. 💊"
- "No joke: grain-free diets cause heart disease. your dog doesn't need it. 💔"
- "Quick thing: brush teeth 3x weekly. prevents $2K vet bills. 🦷"

IMPORTANT:
- Keep tweets SHORT - 150 characters max
- End ALL tweets with a period like the examples
- NO hashtags
- VARY how you start tweets
- Be confident and specific`;

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
