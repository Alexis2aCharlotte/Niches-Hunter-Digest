import { DigestAnalysis, DigestNiche } from '../services/openai';

const SITE_URL = process.env.SITE_URL || 'https://nicheshunter.app';

/**
 * Potential level colors
 */
const potentialColors: Record<string, string> = {
  'massive': '#E74C3C',
  'very high': '#E91E63',
  'high': '#F39C12',
  'growing fast': '#27AE60',
  'moderate': '#3498DB',
  'default': '#00CC6A'
};

function getPotentialColor(potential: string): string {
  const key = potential.toLowerCase();
  for (const [label, color] of Object.entries(potentialColors)) {
    if (key.includes(label)) return color;
  }
  return potentialColors['default'];
}

/**
 * Generate a single niche teaser card
 */
function generateNicheTeaser(niche: DigestNiche, index: number): string {
  const color = getPotentialColor(niche.potential);
  const number = index + 1;

  return `
    <!-- Niche ${number} -->
    <tr>
      <td style="padding:0 0 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 12px rgba(0,0,0,0.04);">
          <tr>
            <td style="padding:20px 24px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <!-- Niche name + potential badge -->
                <tr>
                  <td>
                    <div style="font-size:18px;font-weight:700;color:#111;margin-bottom:8px;">
                      ${niche.emoji} ${niche.name}
                    </div>
                  </td>
                  <td style="text-align:right;vertical-align:top;">
                    <div style="display:inline-block;background:${color};color:#fff;font-size:10px;font-weight:700;padding:4px 10px;border-radius:100px;text-transform:uppercase;letter-spacing:0.5px;">
                      ${niche.potential}
                    </div>
                  </td>
                </tr>
                <!-- Teaser text -->
                <tr>
                  <td colspan="2" style="padding-top:4px;">
                    <p style="margin:0;font-size:14px;color:#555;line-height:1.6;">${niche.teaser}</p>
                  </td>
                </tr>
                <!-- Proof point -->
                <tr>
                  <td colspan="2" style="padding-top:10px;">
                    <div style="font-size:12px;color:#888;font-style:italic;">
                      📊 ${niche.proof}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

/**
 * Generate the full digest HTML email
 */
export function generateDigestHTML(digest: DigestAnalysis): string {
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Generate niche teasers
  let nichesHtml = '';
  digest.niches.forEach((niche, index) => {
    nichesHtml += generateNicheTeaser(niche, index);
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">
  <meta name="color-scheme" content="light dark">
  <title>Niches Hunter - Weekly Digest</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Roboto,sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:32px 16px;background-color:#f5f5f7;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table cellpadding="0" cellspacing="0" width="100%" border="0" style="max-width:560px;">
          
          <!-- Logo -->
          <tr>
            <td style="text-align:center;padding-bottom:24px;">
              <div style="display:inline-block;background:#111;padding:10px 20px;border-radius:100px;">
                <span style="letter-spacing:2px;font-size:12px;font-weight:700;color:#00FF88;">
                  🎯 NICHES HUNTER
                </span>
              </div>
            </td>
          </tr>

          <!-- Header Card -->
          <tr>
            <td style="padding-bottom:24px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.06);">
                <tr>
                  <td style="padding:32px 28px;text-align:center;">
                    <div style="font-size:13px;color:#888;margin-bottom:12px;">${today}</div>
                    <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#111;letter-spacing:-0.5px;line-height:1.3;">
                      ${digest.niches.length} niches spotted this week
                    </h1>
                    <p style="margin:0;font-size:15px;color:#555;line-height:1.6;">
                      ${digest.intro}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Section Label -->
          <tr>
            <td style="padding:4px 0 16px;">
              <div style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:2px;text-align:center;">
                Trending Niches
              </div>
            </td>
          </tr>

          <!-- NICHE TEASERS -->
          ${nichesHtml}

          <!-- CTA Card - Upgrade to Pro -->
          <tr>
            <td style="padding:8px 0 24px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#111;border-radius:20px;overflow:hidden;">
                <tr>
                  <td style="padding:32px 28px;text-align:center;">
                    <div style="font-size:11px;color:#FFD700;font-weight:700;letter-spacing:2px;margin-bottom:16px;text-transform:uppercase;">
                      🏆 Go Pro
                    </div>
                    <p style="font-size:18px;color:#fff;font-weight:600;line-height:1.5;margin:0 0 8px;">
                      Want the full analysis?
                    </p>
                    <p style="font-size:14px;color:#999;line-height:1.5;margin:0 0 24px;">
                      Pro members get daily deep dives: market gaps, step-by-step strategies, competitor data, and revenue estimates for every niche.
                    </p>
                    <!-- What's locked -->
                    <div style="background:#1a1a1a;border-radius:8px;padding:14px 16px;margin-bottom:24px;border:1px dashed #333;text-align:left;">
                      <div style="font-size:13px;color:#888;line-height:1.8;">
                        🔒 The Gap to exploit<br>
                        🔒 Step-by-step action plan<br>
                        🔒 Competitor deep dive & MRR<br>
                        🔒 Keywords & ASO strategy
                      </div>
                    </div>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="background:#FFD700;border-radius:12px;text-align:center;">
                          <a href="${SITE_URL}/niches" style="display:block;padding:16px 24px;color:#000;font-size:15px;font-weight:700;text-decoration:none;">
                            ${digest.cta_text} →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="text-align:center;padding:16px;">
              <p style="margin:0 0 8px;font-size:14px;color:#666;">
                Happy hunting 🚀
              </p>
              <a href="${SITE_URL}" style="text-decoration:none;font-size:13px;font-weight:600;color:#00CC6A;">
                nicheshunter.app
              </a>
              <p style="margin:16px 0 0;">
                <a href="{{UNSUBSCRIBE_URL}}" style="color:#999;text-decoration:underline;font-size:11px;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
