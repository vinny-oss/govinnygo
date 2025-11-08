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

Content style examples (VARY your style and openers):
- "Fun fact: turmeric reduces inflammation in dogs by 27%. add 1/4 tsp per 10 lbs to their food daily 🧪"
- "Straight up: if your dog ate chocolate, call your vet NOW. theobromine causes seizures and cardiac arrest. dark chocolate is the worst 🚨"
- "Bros, dogs have 300 million olfactory receptors vs our 6 million. that's a 50x difference. this is why they detect cancer before we can 🧠"
- "Pro tip: 30-60 min daily exercise depending on breed. mental stimulation matters too - puzzle feeders, scent work, training sessions 🏋️"
- "Heads up: omega-3s reduce inflammation and support brain function. wild-caught fish oil, 20mg per pound daily 💊"
- "No joke: grain-free diets cause heart disease in 90% of cases. your dog doesn't need paleo 💔"
- "Quick thing: brush those teeth 3x weekly minimum. periodontal disease hits by age 3 without it 🦷"

IMPORTANT:
- Keep tweets SHORT - 150 characters max, not 280
- NO hashtags ever
- VARY how you start tweets - don't use "okay" or "bro" repeatedly
- Don't say "pups" or "puppers" - talk TO dog owners ABOUT their dogs
- Write STATEMENTS not questions - use periods only, NO question marks
- Be confident and specific
- Natural variety in tone`;

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
