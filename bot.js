const TelegramBot = require('node-telegram-bot-api');
const config = require('./config.js');
const { startpairing } = require('./pair.js');

const bot = new TelegramBot(config.TELEGRAM_BOT_TOKEN, { polling: true });

const WELCOME_IMAGE = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663880460655/oBHbHdgBaZHRJbmc.png";

console.log('🤖 Sasuke Private Bot Telegram wrapper started with visual assets...');

bot.on('polling_error', (error) => {
  console.error('Telegram Polling Error:', error);
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const caption = 
    "╭ ⟨ *𝗦𝗔𝗦𝗨𝗞𝗘 𝗣𝗥𝗜𝗩𝗔𝗧𝗘 𝗕𝗢𝗧* ◖ ᴠ𝟲.0 ◗ ⟩ ✦\n" +
    "│ ⎋ ꜱʏꜱᴛᴇᴍ : ᴋᴏɴᴏʜᴀ_ᴄᴏʀᴇ\n" +
    "├────────────⬣\n" +
    "│ ❂ *𝗪𝗘𝗟𝗖𝗢𝗠𝗘, 𝗦𝗛𝗢𝗕𝗨𝗡𝗦𝗛𝗜*\n" +
    "│ ⟡ Link your WhatsApp session below.\n" +
    "├────────────⬣\n" +
    "│ ⚡ *𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦*\n" +
    "│  ▸ `/pair <whatsapp_number>`\n" +
    "│  ▸ `/help` · `/ping`\n" +
    "╰────────────⬣\n\n" +
    "_Example: `/pair 2348089281494`_";

  bot.sendPhoto(chatId, WELCOME_IMAGE, {
    caption: caption,
    parse_mode: 'Markdown'
  }).catch((err) => {
    console.error('Failed to send photo, falling back to text:', err.message);
    bot.sendMessage(chatId, caption, { parse_mode: 'Markdown' });
  });
});

bot.onText(/\/pair\s+(.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const phoneNumber = match[1].trim();

  console.log(`⏳ Pairing request for ${phoneNumber} from ${chatId}`);

  const statusMsg = await bot.sendMessage(chatId, "⚡ *Konoha Core* initiating pairing sequence...", { parse_mode: 'Markdown' });

  try {
    startpairing(phoneNumber, async (result) => {
      if (result.success) {
        const pairingText = 
          "╭ ⟨ *𝗣𝗔𝗜𝗥𝗜𝗡𝗚 𝗦𝗨𝗖𝗖𝗘𝗦𝗦𝗙𝗨𝗟* ◗ ⟩ ✦\n" +
          "├────────────⬣\n" +
          "│ 🔑 *Code:* `" + result.code + "`\n" +
          "│ ⏳ *Expires:* `60 seconds`\n" +
          "├────────────⬣\n" +
          "│ _Enter this code in WhatsApp -> Linked Devices -> Link with phone number._\n" +
          "╰────────────⬣";
        
        await bot.editMessageText(pairingText, {
          chat_id: chatId,
          message_id: statusMsg.message_id,
          parse_mode: 'Markdown'
        });
      } else {
        await bot.editMessageText(`❌ *Pairing Failed*\n\nReason: \`${result.error || 'Unknown error'}\``, {
          chat_id: chatId,
          message_id: statusMsg.message_id,
          parse_mode: 'Markdown'
        });
      }
    });
  } catch (e) {
    await bot.editMessageText(`❌ *Error*\n\n\`${e.message}\``, {
      chat_id: chatId,
      message_id: statusMsg.message_id,
      parse_mode: 'Markdown'
    });
  }
});
