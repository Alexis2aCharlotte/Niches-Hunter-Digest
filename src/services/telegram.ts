import TelegramBot from 'node-telegram-bot-api';

// Lazy initialization
let bot: TelegramBot | null = null;

function getBot(): TelegramBot {
  if (!bot) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not set');
    }
    bot = new TelegramBot(token, { polling: false });
  }
  return bot;
}

const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '1791080209';

/**
 * Send notification to Telegram
 */
export async function notifyTelegram(message: string): Promise<void> {
  try {
    await getBot().sendMessage(CHAT_ID, message);
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
    // Don't throw - Telegram is not critical
  }
}
