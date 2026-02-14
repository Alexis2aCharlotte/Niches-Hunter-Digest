/**
 * Digest Generator
 * 
 * Fetches the last 2-3 daily newsletters, summarizes them into a teaser digest,
 * and sends to free subscribers (2-3x per week).
 * 
 * WORKFLOW:
 * 1. Get recent newsletters from newsletters_v2
 * 2. Generate AI digest (teaser summaries)
 * 3. Generate digest HTML
 * 4. Get active subscribers
 * 5. Send emails
 * 6. Notify Telegram
 */

import dotenv from 'dotenv';
dotenv.config();

import { getRecentNewsletters, getActiveSubscribers } from './services/supabase';
import { generateDigest } from './services/openai';
import { generateDigestHTML } from './templates/digest';
import { sendDigestBatch } from './services/email';
import { notifyTelegram } from './services/telegram';

/**
 * Main digest generation function
 */
export async function generateDigestNewsletter(): Promise<void> {
  console.log('');
  console.log('═'.repeat(60));
  console.log('📰 NICHES HUNTER - Digest Generator');
  console.log('═'.repeat(60));
  console.log('');

  const subscribersTable = process.env.SUBSCRIBERS_TABLE || 'newsletter_subscribers_test';
  console.log(`⚠️  Subscribers table: ${subscribersTable}`);
  if (subscribersTable.includes('test')) {
    console.log('   🧪 RUNNING IN TEST MODE');
  }
  console.log('');

  try {
    // =========================================
    // Step 1: Get recent newsletters
    // =========================================
    console.log('📥 Step 1: Fetching recent newsletters...');
    const newsletters = await getRecentNewsletters(3);
    
    if (newsletters.length === 0) {
      console.log('⚠️  No newsletters found. Skipping digest generation.');
      await notifyTelegram('⚠️ Digest skipped: No recent newsletters found');
      return;
    }
    
    console.log('   📋 Newsletters found:');
    for (const nl of newsletters) {
      console.log(`      • "${nl.title}" (${nl.run_date})`);
    }
    console.log('');

    // =========================================
    // Step 2: Generate AI digest
    // =========================================
    console.log('🤖 Step 2: Generating AI digest from recent newsletters...');
    const newsletterContents = newsletters.map(nl => nl.content);
    const digest = await generateDigest(newsletterContents);
    console.log(`   ✅ Digest generated:`);
    console.log(`      Featured: ${digest.featured.emoji} ${digest.featured.name}`);
    console.log(`      Hidden: ${digest.hidden.length} niches`);
    console.log(`   📌 Subject: "${digest.subject}"`);
    console.log('');

    // =========================================
    // Step 3: Generate HTML
    // =========================================
    console.log('🎨 Step 3: Generating digest HTML...');
    const html = generateDigestHTML(digest);
    console.log(`   ✅ HTML generated (${html.length} characters)`);
    console.log('');

    // =========================================
    // Step 4: Get active subscribers
    // =========================================
    console.log('👥 Step 4: Fetching active subscribers...');
    const subscribers = await getActiveSubscribers();
    const emails = subscribers.map(s => s.email);
    console.log(`   ✅ Found ${emails.length} active subscribers`);
    console.log('');

    if (emails.length === 0) {
      console.log('⚠️  No subscribers found. Skipping email send.');
      await notifyTelegram('⚠️ Digest generated but no subscribers to send to');
      return;
    }

    // =========================================
    // Step 5: Send emails
    // =========================================
    console.log('📧 Step 5: Sending digest emails...');
    const { success, failed } = await sendDigestBatch(emails, html, digest.subject);
    console.log(`   ✅ Sent: ${success} | ❌ Failed: ${failed}`);
    console.log('');

    // =========================================
    // Step 6: Notify via Telegram
    // =========================================
    console.log('📱 Step 6: Sending Telegram notification...');
    const telegramMessage = `📰 Digest Sent! 📋

📌 ${digest.subject}

🔥 Featured: ${digest.featured.emoji} ${digest.featured.name}
🔒 Hidden: ${digest.hidden.length} niches (redacted)

📊 Stats:
• Subscribers: ${emails.length} (${subscribersTable})
• Sent: ${success}
• Failed: ${failed}

${failed > 0 ? '⚠️ Check logs for failed emails' : '✅ All sent!'}`;

    await notifyTelegram(telegramMessage);
    console.log('   ✅ Telegram notification sent');

    // Done!
    console.log('');
    console.log('═'.repeat(60));
    console.log('🎉 Digest generation complete!');
    console.log('═'.repeat(60));
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ ERROR:', error);
    
    await notifyTelegram(`❌ Digest generation FAILED!\n\nError: ${error}`);
    
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  generateDigestNewsletter()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}
