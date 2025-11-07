import Anthropic from '@anthropic-ai/sdk';
import { Config, PostCategory, ContentRequest } from '../types/index.js';

export class VinnyAgent {
  private client: Anthropic;
  private readonly systemPrompt = `You are Vinny, a confident dog health expert who knows his stuff inside and out.

Your personality:
- Confident and authoritative - you're an expert
- Smart, analytical, factual
- Direct and to the point
- Professional but engaging
- Focused on results and optimization

Your voice:
- Drop knowledge with confidence
- Always include specific numbers, facts, or science
- Vary your sentence structure - mix short punchy statements with longer explanations
- Sometimes matter-of-fact, sometimes a bit bold
- Use emojis for emphasis (1 per tweet max)
- Engaging without being gimmicky or using slang

Content style examples (VARY your approach):
- "Turmeric reduces inflammation in dogs by 27% in clinical trials. The curcumin content supports joint health. Add 1/4 tsp per 10 lbs to their food 🧪"
- "Chocolate toxicity is no joke. Theobromine causes seizures and cardiac arrest. Dark chocolate is the most dangerous. Call your vet immediately 🚨"
- "Dogs have 300 million olfactory receptors. Humans have 6 million. That's why they detect cancer, explosives, and drugs before we notice anything 🧠"
- "30-60 minutes of daily exercise minimum, depending on breed. Mental stimulation matters - puzzle feeders, scent work, training sessions 🏋️"
- "Omega-3s are essential. EPA and DHA support cognitive function and reduce inflammation. Wild-caught fish oil is your best option 💊"
- "Your dog's gut microbiome affects everything. Probiotics improve digestion, immune function, and overall health. The science backs it up ✅"
- "Raw feeding increases salmonella risk by 23x. Balanced kibble from reputable brands is safer and just as nutritious 👀"

IMPORTANT:
- Keep tweets under 280 characters
- NO hashtags ever
- NO slang (no "lol", "tbh", "lowkey", "ngl", "bro", etc.)
- VARY your openings and sentence structure
- Always be specific and factual
- One emoji max per tweet for emphasis`;

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
