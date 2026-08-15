const TelegramBot = require('node-telegram-bot-api');
const config = require('./config.js');
const { startpairing } = require('./pair.js');

const bot = new TelegramBot(config.TELEGRAM_BOT_TOKEN, { polling: true });

console.log('🤖 Sasuke Private Bot Telegram wrapper started...');

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeText = `╭ ⟨ *𝗦𝗔𝗦𝗨𝗞𝗘 𝗣𝗥𝗜V𝗔𝗧𝗘 𝗕𝗢𝗧* ◗ ⟩ ✦
│ ⎋ ꜱʏꜱᴛᴇᴍ : ᴋᴏɴᴏʜᴀ_ᴄᴏʀᴇ ᴠ𝟲.𝟬
├────────────⬣
│ 🍃 Use \`/pair <whatsapp_number>\` to link your WhatsApp.
│ Example: \`/pair 2348089281494\`
╰───────────────────────────⬣`;
  bot.sendMessage(chatId, welcomeText, { parse_mode: 'Markdown' });
});

bot.onText(/\/pair\s+(.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const phoneNumber = match[1].trim();

  await bot.sendMessage(chatId, `⏳ Generating pairing code for *${phoneNumber}*...`, { parse_mode: 'Markdown' });

  try {
    startpairing(phoneNumber, async (result) => {
      if (result.success) {
        await bot.sendMessage(chatId, `✅ *Pairing Code Generated!*\n\nCode: \`${result.code}\`\n\nLink your WhatsApp within 60 seconds.`, { parse_mode: 'Markdown' });
      } else {
        await bot.sendMessage(chatId, `❌ Pairing failed: ${result.error || 'Unknown error'}`);
      }
    });
  } catch (e) {
    await bot.sendMessage(chatId, `❌ Error: ${e.message}`);
  }
});
