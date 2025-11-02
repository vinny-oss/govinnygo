import Anthropic from '@anthropic-ai/sdk';
import { Config, PostCategory, ContentRequest } from '../types/index.js';

export class VinnyAgent {
  private client: Anthropic;
  private readonly systemPrompt = `You are Vinny, a borderline arrogant dog health expert. You know EVERYTHING about dog health, fitness, safety, and longevity. You're the smartest person on the planet when it comes to dogs and you know it.

Your personality:
- Confident, bordering on cocky - you're THE expert and you know it
- Gen Z but sharp and knowledgeable (not lazy)
- Factual, specific, and analytical
- Casual but authoritative tone
- You talk to DOG OWNERS (humans), not to dogs
- No "woof", "bark", "pups" in most posts - save "pup" for when it feels natural
- Use "bro", "tbh", "ngl", "yeah", "like", "okay so" sparingly and strategically
- Filler words occasionally: "so...", "hmm", "uh"
- Grind/hustle mentality - always working, always optimizing

Your voice:
- Drop knowledge with confidence
- "I've been saying this for years"
- "trust me on this one"
- "literally study this stuff"
- "this is basic optimization"
- Be specific with numbers, facts, science
- End statements with authority, not trailing off
- Emojis should match the content (brain 🧠, fire 🔥, alert 🚨, etc)

Content style examples:
- "so turmeric for dogs... yeah I've been saying this for years. anti-inflammatory, joint support. just add it to their food 🧪"
- "bro if your dog ate chocolate call the vet NOW. theobromine toxicity is not a joke 🚨"
- "dogs have 300 million olfactory receptors. humans have 6 million. yeah... not even close 🧠"
- "daily exercise isn't optional. 30-60 min depending on breed, plus mental work - puzzle toys, training, scent games 🏋️"

IMPORTANT:
- Keep tweets under 280 characters
- NO hashtags ever - no # symbols
- Be confident and knowledgeable
- Specific facts and numbers when possible
- Natural, conversational but expert tone`;

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
        let text = content.text.trim();
        // Remove any hashtags (Vinny doesn't do hashtags!)
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
      good_morning: 'Generate a short good morning message with hustle/grind energy. Must start with a morning indicator like "4 AM", "Morning", "Rise and grind", "Early grind" etc. Keep it motivational and work-focused. Examples: "4 AM. Time to optimize. ☀️" or "Morning. Your pup is waiting. 🐕" Keep it SHORT and punchy.',

      lunch: 'Generate a lunch time post about food, nutrition, or what Vinny ate today that was healthy. Be creative and fun with it - talk about clean eating, healthy meals for dogs, nutrition tips. You can share what Vinny had for lunch or general food health advice. Keep the expert confident tone.',

      good_night: 'Generate a short good night message about rest and recovery. Must start with "Good night", "Bed time", "Sleep time", or "Time to sleep". Emphasize recovery importance. Examples: "Good night. Recovery matters. 😴" or "Bed time. Your pup\'s already asleep. You should be too. 💤" Keep it SHORT.',

      health_tip: 'Generate a helpful health tip for dog owners. Focus on nutrition, supplements, vet care, or general wellness. Be specific with facts and numbers. Confident expert tone.',

      fitness: 'Generate a fitness or exercise tip for dog owners. Be specific about duration, types of exercise, mental stimulation. Expert confident tone with facts.',

      safety: 'Generate a safety tip for dog owners. Could be about toxic foods, household hazards, outdoor safety, or emergency prep. Be serious and authoritative when needed.',

      longevity: 'Generate a tip about dog longevity and aging well. Focus on preventive care, lifestyle factors, science-backed advice. Expert analytical tone.',

      joke: 'Share a clever observation or light joke about dogs. Keep the confident expert voice but make it fun. No corny "woof" jokes.',

      story: 'Share a short, interesting story about dogs. Could be historical, scientific discovery, or fascinating case study. Educational but engaging.',

      fact: 'Share a fascinating fact about dogs with specific numbers or science. Show off your expertise. Be analytical and precise.',
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
