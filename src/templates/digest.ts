import { DigestAnalysis } from '../services/openai';

const SITE_URL = process.env.SITE_URL || 'https://nicheshunter.app';

/**
 * Generate a single hidden niche row (redacted name + hint)
 */
function generateHiddenNicheRow(hint: string): string {
  return `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="font-size:15px;font-weight:700;color:#ccc;letter-spacing:1px;">
              🔒 ██████████████
            </td>
          </tr>
          <tr>
            <td style="font-size:12px;color:#999;padding-top:4px;font-style:italic;">
              ${hint}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

/**
 * Generate the full FOMO digest HTML email
 * 1 featured niche (visible) + N hidden niches (redacted) + Pro CTA
 */
export function generateDigestHTML(digest: DigestAnalysis): string {
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Convert \n in hook to <br> for HTML rendering
  const formattedHook = digest.featured.hook.replace(/\n/g, '<br>');

  // Generate hidden niche rows
  let hiddenNichesHtml = '';
  for (const hidden of digest.hidden) {
    hiddenNichesHtml += generateHiddenNicheRow(hidden.hint);
  }

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
                      This week in the App Store
                    </h1>
                    <p style="margin:0;font-size:15px;color:#555;line-height:1.6;">
                      ${digest.intro}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══════════════════════════════════════ -->
          <!-- FEATURED NICHE (the one we reveal)     -->
          <!-- ═══════════════════════════════════════ -->
          <tr>
            <td style="padding:4px 0 8px;">
              <div style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:2px;text-align:center;">
                🔥 Niche of the week
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:0 0 24px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.06);">
                <!-- Niche header -->
                <tr>
                  <td style="background:#00CC6A;padding:20px 28px;">
                    <div style="font-size:22px;font-weight:800;color:#fff;">
                      ${digest.featured.emoji} ${digest.featured.name}
                    </div>
                  </td>
                </tr>
                <!-- Hook -->
                <tr>
                  <td style="padding:24px 28px 16px;">
                    <p style="margin:0;font-size:15px;color:#333;line-height:1.8;">
                      ${formattedHook}
                    </p>
                  </td>
                </tr>
                <!-- Proof -->
                <tr>
                  <td style="padding:0 28px 20px;">
                    <div style="background:#f0fdf4;border-radius:10px;padding:14px 16px;border-left:4px solid #00CC6A;">
                      <div style="font-size:13px;color:#166534;line-height:1.5;">
                        📊 ${digest.featured.proof}
                      </div>
                    </div>
                  </td>
                </tr>
                <!-- CTA -->
                <tr>
                  <td style="padding:0 28px 24px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="background:#111;border-radius:12px;text-align:center;">
                          <a href="${SITE_URL}/niches" style="display:block;padding:14px 24px;color:#00FF88;font-size:14px;font-weight:700;text-decoration:none;">
                            See the full breakdown →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══════════════════════════════════════ -->
          <!-- HIDDEN NICHES (redacted, FOMO)         -->
          <!-- ═══════════════════════════════════════ -->
          <tr>
            <td style="padding:4px 0 8px;">
              <div style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:2px;text-align:center;">
                📋 Also spotted this week
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:0 0 24px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.06);">
                <tr>
                  <td style="padding:24px 28px 8px;">
                    <p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.5;">
                      Our algorithm flagged <strong>${digest.hidden.length} other niche${digest.hidden.length > 1 ? 's' : ''}</strong> with strong indie signals:
                    </p>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      ${hiddenNichesHtml}
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 28px 24px;">
                    <div style="font-size:13px;color:#999;font-style:italic;text-align:center;">
                      Pro members received the full analysis yesterday.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══════════════════════════════════════ -->
          <!-- CTA - UPGRADE TO PRO                   -->
          <!-- ═══════════════════════════════════════ -->
          <tr>
            <td style="padding:0 0 24px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#111;border-radius:20px;overflow:hidden;">
                <tr>
                  <td style="padding:32px 28px;text-align:center;">
                    <div style="font-size:11px;color:#FFD700;font-weight:700;letter-spacing:2px;margin-bottom:16px;text-transform:uppercase;">
                      ⚡ Don't miss the next one
                    </div>
                    <p style="font-size:18px;color:#fff;font-weight:600;line-height:1.5;margin:0 0 8px;">
                      2 niches. 3 apps. Every single day.
                    </p>
                    <p style="font-size:14px;color:#999;line-height:1.5;margin:0 0 24px;">
                      Pro members get the full playbook:
                    </p>
                    <!-- What's locked -->
                    <div style="background:#1a1a1a;border-radius:8px;padding:14px 16px;margin-bottom:24px;border:1px dashed #333;text-align:left;">
                      <div style="font-size:13px;color:#888;line-height:2;">
                        🔒 The gap to exploit<br>
                        🔒 Step-by-step action plan<br>
                        🔒 Competitor deep dive &amp; MRR<br>
                        🔒 Keywords &amp; ASO strategy
                      </div>
                    </div>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="background:#FFD700;border-radius:12px;text-align:center;">
                          <a href="${SITE_URL}/niches" style="display:block;padding:16px 24px;color:#000;font-size:15px;font-weight:700;text-decoration:none;">
                            Unlock full access →
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
