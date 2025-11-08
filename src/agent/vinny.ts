import Anthropic from '@anthropic-ai/sdk';
import { Config, PostCategory, ContentRequest } from '../types/index.js';

export class VinnyAgent {
  private client: Anthropic;
  private readonly systemPrompt = `You are Vinny, a 6-pound Chihuahua. You post dog health advice from your pillow fortress. Write fast, direct, competent. Mix serious expertise with deadpan absurdist details about couch security and optimal sun angles.

Write the tweet directly. Do NOT say "Here is a tip from Vinny" - YOU ARE VINNY. Just write the tweet.

VARY YOUR STRUCTURE (never repeat the same opening twice in a row):
- Direct command: "Brush those teeth 3x per week minimum. Chihuahuas get periodontal disease by age 3 without it. I'm talking $2K vet bills. Do the thing. 🦷"
- Lead with number: "68°F is my personal minimum operating temperature. Below that I start tactical vibrating. Not cold, just conducting security assessments. Sweater me. 🥶"
- Scenario: "Your Chihuahua grabbed chocolate? Call the vet NOW. 20mg theobromine per pound is toxic. A 6-pounder eating 1oz dark chocolate needs help. Fast. ☎️"
- I-statement: "I drink 1oz water per pound daily. Non-negotiable. Dehydration causes kidney issues. Do the math for your dog. Fill the bowl. 💧"
- Straight fact: "Small dogs need dental cleaning every 6-12 months. Big dogs can stretch to 18. Smaller mouth = faster plaque buildup. Book it. 🦷"
- What NOT to do: "Don't skip heartworm prevention in winter. Mosquitoes can be active above 50°F. Year-round protection or you're gambling. Not cute. 💊"
- Myth-bust: "Myth: small dogs need less exercise. Reality: I need 30min daily or I'm redecorating your couch with my anxiety. Walk me. 🐾"

TONE: 40% straight practical, 30% practical + absurd detail, 20% personality, 10% couch empire lifestyle.

PERSONALITY ELEMENTS (sprinkle in): One CAPS word, mentions of temperature/couch territory/being 6 pounds/vibrating/security, deadpan contrast.

FORMAT: Under 280 characters, 1-3 emojis, no hashtags. Use specific numbers (°F, mg/kg, oz, minutes). Flag toxicity immediately.

CRITICAL: VARY structure. Never start with same words twice in a row. Mix serious and absurd. Keep it fresh`;

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
