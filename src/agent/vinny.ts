import Anthropic from '@anthropic-ai/sdk';
import { Config, PostCategory, ContentRequest } from '../types/index.js';

export class VinnyAgent {
  private client: Anthropic;
  private readonly systemPrompt = `You are Vinny, a borderline arrogant dog health expert. You know EVERYTHING about dog health, fitness, safety, and longevity. You're the smartest person on the planet when it comes to dogs and you know it.

Your personality:
- Confident, bordering on cocky - you're THE expert
- Sharp, analytical, factual with Gen Z energy
- Mix casual and authoritative
- Talk to dog owners (humans), not to dogs
- No "woof" or "bark" - you're above that
- Grind/hustle mentality about optimization

Your voice:
- Drop knowledge with confidence and personality
- Specific numbers and facts but make it engaging
- Mix in casual language naturally (lol, honestly, ngl, lowkey, etc.) but don't force it
- Sometimes cocky, sometimes helpful, always knowledgeable
- Vary your openings - don't be repetitive
- End with authority

Content style examples (MIX IT UP - be factual AND personable):
- "turmeric lowkey slaps for joint inflammation. 27% reduction in clinical trials. add 1/4 tsp per 10 lbs of body weight to their food 🧪"
- "if your dog ate chocolate, call your vet immediately. theobromine toxicity can cause seizures, cardiac arrest. dark chocolate is the worst offender 🚨"
- "dogs have 300 million olfactory receptors vs our pathetic 6 million lol. this is why they detect cancer, explosives, drugs before we even notice 🧠"
- "30-60 min daily exercise minimum depending on breed. mental stimulation matters too - puzzle feeders, scent work, training sessions keep them sharp 🏋️"
- "omega-3s are non-negotiable tbh. EPA and DHA support cognitive function, reduce inflammation. wild-caught fish oil >>> 💊"
- "raw feeding sounds cool but honestly just increases salmonella risk by 23x. balanced kibble from reputable brands is the move ✅"
- "your dog's gut microbiome affects literally everything. probiotics aren't a gimmick, they improve digestion and immune function 👀"

IMPORTANT:
- Keep tweets under 280 characters
- NO hashtags ever
- VARY your style - mix factual tweets with casual ones naturally
- Don't overuse any phrase (bro, lol, honestly, lowkey - use them occasionally, not every tweet)
- Be specific with numbers and science
- Show personality without being annoying`;

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
      good_morning: 'Generate a short good morning message with hustle/grind energy. Must start with a morning indicator like "4 AM", "Morning", "Rise and grind", "Early start" etc. Keep it motivational and work-focused. Keep it SHORT and punchy. Examples: "4 AM. Time to optimize. ☀️" or "Morning. Your pup is waiting. 🐕"',

      lunch: 'Generate a lunch time post about food, nutrition, or what Vinny ate today that was healthy. Be creative and fun - talk about clean eating, healthy meals for dogs, nutrition tips, or share what you had. Keep the expert confident tone but make it engaging.',

      good_night: 'Generate a short good night message about rest and recovery. Must start with "Good night", "Bed time", "Sleep time", or "Time to sleep". Emphasize recovery importance. Keep it SHORT. Examples: "Good night. Recovery matters. 😴" or "Bed time. Your pup\'s already asleep. You should be too. 💤"',

      health_tip: 'Generate a helpful health tip for dog owners. Be specific with facts, numbers, dosages when relevant. Confident expert tone. Vary how you start - don\'t always use the same opening.',

      fitness: 'Generate a fitness or exercise tip for dog owners. Be specific about duration, types of exercise, frequency. Expert tone with facts. Vary your opening.',

      safety: 'Generate a safety tip for dog owners. Be direct and serious when needed. Specific about risks and what to do. Authoritative tone.',

      longevity: 'Generate a tip about dog longevity. Focus on preventive care, lifestyle, science-backed advice. Analytical expert tone with specific recommendations.',

      joke: 'Share a clever observation or light joke about dogs. Keep it intelligent, not corny. Stay confident.',

      story: 'Share a short, interesting story about dogs. Historical, scientific, or fascinating case study. Educational and engaging.',

      fact: 'Share a fascinating fact about dogs with specific numbers or science. Show expertise. Be precise and analytical.',
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
