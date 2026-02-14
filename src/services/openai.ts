import OpenAI from 'openai';

// Lazy initialization
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// ============================================
// TYPES - Structure du digest
// ============================================

export interface DigestNiche {
  emoji: string;
  name: string;
  teaser: string;        // 1-2 sentences hook
  proof: string;         // 1 app name + rank as social proof
  potential: string;     // "High" / "Very High" etc.
}

export interface DigestAnalysis {
  subject: string;       // Email subject line
  intro: string;         // 1-2 sentence intro
  niches: DigestNiche[]; // 3-6 niches (from 2-3 newsletters)
  cta_text: string;      // CTA button text
}

// ============================================
// AI DIGEST GENERATION
// ============================================

/**
 * Generate a digest summary from recent newsletter HTML content
 * Takes raw HTML newsletters and creates a teaser digest
 */
export async function generateDigest(newsletterContents: string[]): Promise<DigestAnalysis> {
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Combine newsletter content for context
  const combinedContent = newsletterContents
    .map((content, i) => `=== NEWSLETTER ${i + 1} ===\n${content}`)
    .join('\n\n');

  const prompt = `You are writing a DIGEST email for Niches Hunter, a service that finds profitable app niches for indie developers.

I'm giving you ${newsletterContents.length} recent daily newsletters (in HTML). Your job is to extract the niches mentioned and create a SHORT, TEASER digest that makes readers want to upgrade to Pro for the full analysis.

${combinedContent}

=== YOUR TASK ===

Create a digest that:
1. Lists each niche from the newsletters as a SHORT teaser (not the full analysis!)
2. Gives just enough info to be intriguing but NOT enough to act on
3. Makes the reader think "I need to see the full analysis"

=== RULES ===
- Extract ALL niches from the newsletters (should be 3-6 total from 2-3 newsletters)
- Each niche teaser is MAX 2 sentences - be punchy and intriguing
- Include 1 proof point per niche (app name + rank) to show it's real data
- Do NOT include: the gap, the strategy, the full app insights, or the action steps
- Write EVERYTHING in English
- Be conversational, like texting a friend about a hot deal
- The "potential" field should be a short label like "High", "Very High", "Massive", "Growing Fast"

=== OUTPUT FORMAT (JSON ONLY) ===
{
  "subject": "Catchy email subject with emoji, max 50 chars. Teaser style. Example: '4 niches you're missing this week 👀'",
  "intro": "1-2 sentences. Set the scene: how many niches were spotted, why they matter. Be casual and exciting.",
  "niches": [
    {
      "emoji": "🎯",
      "name": "Simple niche name (2-4 words)",
      "teaser": "1-2 sentences max. What's the opportunity WITHOUT giving away the strategy. End with intrigue.",
      "proof": "AppName is #X in CountryFlag — proof this market is real.",
      "potential": "High"
    }
  ],
  "cta_text": "Short CTA text for the upgrade button, max 6 words. Example: 'Get the full playbook'"
}

IMPORTANT: Output valid JSON only. No markdown, no code blocks.`;

  const MAX_RETRIES = 3;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`   🔄 AI attempt ${attempt}/${MAX_RETRIES}...`);
      
      const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a newsletter copywriter. Always respond with valid JSON only. No markdown, no code blocks, no extra text.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Clean JSON
      let jsonText = content.trim();
      jsonText = jsonText.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');

      const result = JSON.parse(jsonText) as DigestAnalysis;
      
      // Validate
      if (!result.niches || result.niches.length === 0) {
        throw new Error('No niches in digest response');
      }
      if (!result.subject || !result.intro) {
        throw new Error('Missing subject or intro');
      }
      
      console.log(`   ✅ Digest generated: ${result.niches.length} niches, subject: "${result.subject}"`);
      return result;

    } catch (error) {
      console.error(`   ⚠️ Attempt ${attempt}/${MAX_RETRIES} failed:`, error instanceof Error ? error.message : error);
      
      if (attempt === MAX_RETRIES) {
        throw new Error(`Failed to generate digest after ${MAX_RETRIES} attempts: ${error}`);
      }
      
      const waitMs = 2000 * attempt;
      console.log(`   ⏳ Retrying in ${waitMs / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
  }

  throw new Error('Unexpected: exhausted retries without returning or throwing');
}
