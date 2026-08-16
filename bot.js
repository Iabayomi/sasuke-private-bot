const TelegramBot = require('node-telegram-bot-api');
const config = require('./config.js');
const { startpairing } = require('./pair.js');

const bot = new TelegramBot(config.TELEGRAM_BOT_TOKEN, { polling: true });

console.log('🤖 Sasuke Private Bot Telegram wrapper started...');

bot.on('polling_error', (error) => {
  console.error('Telegram Polling Error:', error);
});

bot.on('message', (msg) => {
  console.log(`📩 Received message from ${msg.chat.id}: ${msg.text}`);
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeText = "Welcome to Sasuke Private Bot!\n\nUse /pair [number] to link your WhatsApp.\nExample: /pair 2348089281494";
  bot.sendMessage(chatId, welcomeText)
    .then(() => console.log(`✅ Sent welcome to ${chatId}`))
    .catch((err) => console.error(`❌ Failed to send welcome to ${chatId}:`, err.message));
});

bot.onText(/\/pair\s+(.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const phoneNumber = match[1].trim();

  console.log(`⏳ Pairing request for ${phoneNumber} from ${chatId}`);

  bot.sendMessage(chatId, `⏳ Generating pairing code for ${phoneNumber}...`)
    .catch((err) => console.error(`❌ Failed to send status to ${chatId}:`, err.message));

  try {
    startpairing(phoneNumber, async (result) => {
      if (result.success) {
        bot.sendMessage(chatId, `✅ Pairing Code Generated!\n\nCode: ${result.code}\n\nLink your WhatsApp within 60 seconds.`)
          .then(() => console.log(`✅ Sent code to ${chatId}`))
          .catch((err) => console.error(`❌ Failed to send code to ${chatId}:`, err.message));
      } else {
        bot.sendMessage(chatId, `❌ Pairing failed: ${result.error || 'Unknown error'}`)
          .catch((err) => console.error(`❌ Failed to send error to ${chatId}:`, err.message));
      }
    });
  } catch (e) {
    bot.sendMessage(chatId, `❌ Error: ${e.message}`)
      .catch((err) => console.error(`❌ Failed to send catch error to ${chatId}:`, err.message));
  }
});
