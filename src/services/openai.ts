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
  subject: string;       // Email subject line, mysterious, intriguing
  intro: string;         // 1-2 short sentences. Casual, sets the scene. No "we scanned X apps" crap.
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

We show ONE niche partially (the "featured" niche). Enough to prove the data is real and valuable, but NOT enough to act on. Then we list the OTHER niches as hidden/redacted to create curiosity.

=== WRITING STYLE ===
- NEVER use em dashes (—). Use periods, commas, or line breaks instead.
- Write like a human, not an AI. Short sentences. Conversational.
- When mentioning different apps, PUT EACH APP ON ITS OWN LINE using \\n. This is critical for readability.
- Example hook format:
  "AI photo tools are blowing up right now.\\n\\nPose: AI Photo Video Generator just hit #1 in US Photo & Video.\\nShots is ranking #13 in GB with a tiny team.\\n\\nThese small teams found something. And the top apps all share the same weakness."
- Keep it punchy. No walls of text.

=== RULES FOR INTRO ===
- 1-2 short casual sentences that set the scene
- Do NOT say "we scanned X apps across Y countries". That's boring and robotic.
- Instead, be casual and intriguing: "Interesting week in the App Store.", "A few patterns caught our attention this week.", "Something's happening in a niche nobody's watching."
- Keep it short and human

=== RULES FOR THE FEATURED NICHE ===
- Pick the MOST compelling niche from the newsletters (the one with the best story)
- Write a hook that tells a STORY with specific numbers (ranks, countries, dev size)
- SEPARATE each app mention on its own line using \\n
- Do NOT reveal: the gap, the strategy, the weakness to exploit, the action steps
- End with intrigue: "There's a clear gap nobody is exploiting yet." or "And the top apps all share the same weakness."
- The "proof" is one specific data point: app name, rank, country flag, dev size. NO em dashes.

=== RULES FOR HIDDEN NICHES ===
- Extract 2-4 OTHER niches from the newsletters
- For each, write a SHORT hint (max 8 words) that teases WITHOUT naming the niche
- Examples: "3 apps ranking, low competition", "Solo dev proving the market", "Growing fast in new markets", "New category, zero competition"
- Do NOT include the niche name

=== RULES FOR SUBJECT LINE ===
- Mysterious and intriguing, max 50 characters, with emoji
- Examples: "A niche is blowing up right now 👀", "This solo dev cracked the Top 50", "Nobody's talking about this niche"
- Must make people OPEN the email

=== OUTPUT FORMAT (JSON ONLY) ===
{
  "subject": "Mysterious subject, max 50 chars, with emoji",
  "intro": "1-2 casual short sentences. No 'we scanned X apps'. Be human.",
  "featured": {
    "emoji": "🔥",
    "name": "Simple niche name (2-4 words)",
    "hook": "Use \\n for line breaks between app mentions. Tell a story with numbers. End with intrigue. NO em dashes.",
    "proof": "AppName, a solo dev, is #12 in 🇺🇸. Launched just 3 months ago."
  },
  "hidden": [
    { "hint": "3 apps ranking, low competition" },
    { "hint": "Solo dev proving the market" },
    { "hint": "Growing fast in new markets" }
  ]
}

CRITICAL RULES:
- ZERO em dashes (—) anywhere in the output. Use periods or commas instead.
- Use \\n for line breaks in the hook when switching between app mentions
- Write EVERYTHING in English
- Output valid JSON only. No markdown, no code blocks.
- The hook must be compelling but INCOMPLETE
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
