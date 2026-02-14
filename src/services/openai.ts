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

/** The one niche we reveal (partially) */
export interface FeaturedNiche {
  emoji: string;
  name: string;
  hook: string;          // 2-3 sentences: intriguing story, numbers, but NO strategy
  proof: string;         // "AppName, a solo dev, is #X in Country 🇫🇷 — launched 3 months ago."
}

/** A hidden niche (name redacted, only a teasing hint) */
export interface HiddenNiche {
  hint: string;          // Short teasing hint WITHOUT revealing the niche name. e.g. "3 apps ranking, low competition"
}

export interface DigestAnalysis {
  subject: string;       // Email subject line — mysterious, intriguing
  stats_line: string;    // e.g. "We scanned 2,847 apps across 14 countries this week."
  featured: FeaturedNiche;
  hidden: HiddenNiche[]; // 2-4 hidden niches
}

// ============================================
// AI DIGEST GENERATION
// ============================================

/**
 * Generate a FOMO digest from recent newsletter HTML content
 * Shows 1 niche partially + hides the others behind blurred names
 */
export async function generateDigest(newsletterContents: string[]): Promise<DigestAnalysis> {
  // Combine newsletter content for context
  const combinedContent = newsletterContents
    .map((content, i) => `=== NEWSLETTER ${i + 1} ===\n${content}`)
    .join('\n\n');

  const prompt = `You are a COPYWRITER for Niches Hunter, a service that finds profitable app niches for indie developers.

I'm giving you ${newsletterContents.length} recent daily newsletters (in HTML). Your job is to create a FOMO-inducing digest email that makes free subscribers desperate to upgrade to Pro.

${combinedContent}

=== THE STRATEGY ===

We show ONE niche partially (the "featured" niche) — enough to prove the data is real and valuable, but NOT enough to act on. Then we list the OTHER niches as hidden/redacted to create curiosity.

=== RULES FOR THE FEATURED NICHE ===
- Pick the MOST compelling niche from the newsletters (the one with the best story)
- Write a 2-3 sentence "hook" that tells a STORY: mention specific numbers (ranks, countries), mention if it's a solo dev or small team, mention how fast it's growing
- Do NOT reveal: the gap, the strategy, the weakness to exploit, the action steps
- End the hook with something like "There's a clear gap nobody is exploiting yet." or "And the top apps all share the same weakness." — intrigue WITHOUT details
- The "proof" is one specific data point: app name, rank, country flag, dev size

=== RULES FOR HIDDEN NICHES ===
- Extract 2-4 OTHER niches from the newsletters
- For each, write a SHORT hint (max 8 words) that teases WITHOUT naming the niche
- Examples: "3 apps ranking, low competition", "Solo dev proving the market", "Untapped in EU markets", "New category, growing fast"
- Do NOT include the niche name — it will be displayed as "████████" in the email

=== RULES FOR SUBJECT LINE ===
- Must be mysterious and intriguing
- Examples: "A niche is blowing up right now 👀", "We found something interesting this week", "This solo dev cracked the Top 50"
- Max 50 characters
- Must make people OPEN the email

=== RULES FOR STATS LINE ===
- One sentence with impressive numbers about how much data was analyzed
- Use numbers from the newsletters if available, otherwise estimate realistically
- Example: "We scanned 2,847 apps across 14 countries this week."
- This builds credibility

=== OUTPUT FORMAT (JSON ONLY) ===
{
  "subject": "Mysterious email subject, max 50 chars, with emoji",
  "stats_line": "We scanned X apps across Y countries this week.",
  "featured": {
    "emoji": "🔥",
    "name": "Simple niche name (2-4 words)",
    "hook": "2-3 sentences. Tell a compelling story with numbers. End with intrigue about an unexploited gap. Do NOT reveal the strategy.",
    "proof": "AppName, a solo dev, is #12 in 🇺🇸 — launched just 3 months ago."
  },
  "hidden": [
    { "hint": "3 apps ranking, low competition" },
    { "hint": "Solo dev proving the market" },
    { "hint": "Untapped in EU markets" }
  ]
}

IMPORTANT:
- Write EVERYTHING in English
- Output valid JSON only. No markdown, no code blocks.
- The featured niche hook must be compelling but INCOMPLETE — the reader must feel "I need to see more"
- Hidden niche hints must NOT contain the niche name`;

  const MAX_RETRIES = 3;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`   🔄 AI attempt ${attempt}/${MAX_RETRIES}...`);
      
      const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a newsletter copywriter specialized in FOMO and curiosity-driven content. Always respond with valid JSON only. No markdown, no code blocks, no extra text.' },
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
      if (!result.featured || !result.featured.name || !result.featured.hook) {
        throw new Error('Missing featured niche data');
      }
      if (!result.hidden || result.hidden.length === 0) {
        throw new Error('No hidden niches');
      }
      if (!result.subject) {
        throw new Error('Missing subject');
      }
      
      console.log(`   ✅ Digest generated:`);
      console.log(`      Featured: ${result.featured.emoji} ${result.featured.name}`);
      console.log(`      Hidden: ${result.hidden.length} niches`);
      console.log(`      Subject: "${result.subject}"`);
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
