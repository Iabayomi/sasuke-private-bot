const TelegramBot = require('node-telegram-bot-api');
const config = require('./config.js');
const { startpairing } = require('./pair.js');

if (!config.TELEGRAM_BOT_TOKEN) {
  console.error('CRITICAL: TELEGRAM_BOT_TOKEN is missing in config.js or environment!');
}

const bot = new TelegramBot(config.TELEGRAM_BOT_TOKEN, { polling: true });

const WELCOME_IMAGE = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663880460655/oBHbHdgBaZHRJbmc.png";

console.log('🤖 Sasuke Private Bot Telegram wrapper initialized and polling...');

bot.on('polling_error', (error) => {
  console.error('Telegram Polling Error code:', error.code, error.message);
});

bot.on('error', (error) => {
  console.error('Telegram General Error:', error);
});

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const caption = 
    "SASUKE PRIVATE BOT v6.0\n\n" +
    "Welcome, Shobunshi! Konoha Core is active.\n\n" +
    "Commands:\n" +
    "• /pair <whatsapp_number>\n" +
    "• /help\n" +
    "• /ping\n\n" +
    "Example: /pair 2348089281494";

  try {
    await bot.sendPhoto(chatId, WELCOME_IMAGE, {
      caption: caption
    });
  } catch (err) {
    console.error('Failed to send photo, sending text:', err.message);
    await bot.sendMessage(chatId, caption);
  }
});

bot.onText(/\/ping/, async (msg) => {
  await bot.sendMessage(msg.chat.id, "Pong! Konoha Core is online and stable ⚡");
});

bot.onText(/\/pair\s+(.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const phoneNumber = match[1].trim();

  console.log(`⏳ Received pairing request for ${phoneNumber} from chat ${chatId}`);

  const statusMsg = await bot.sendMessage(chatId, "Initiating Konoha pairing sequence...");

  let replied = false;

  try {
    startpairing(phoneNumber, async (result) => {
      if (replied) return;
      replied = true;

      if (result.success) {
        const pairingText = 
          "PAIRING SUCCESSFUL\n\n" +
          "Code: " + result.code + "\n\n" +
          "Enter this code in WhatsApp -> Linked Devices -> Link with phone number.";
        
        await bot.editMessageText(pairingText, {
          chat_id: chatId,
          message_id: statusMsg.message_id
        });
      } else {
        await bot.editMessageText("Pairing Failed\n\nReason: " + (result.error || 'Unknown error'));
      }
    });

    // Safety timeout in case pairing callback takes too long
    setTimeout(async () => {
      if (!replied) {
        replied = true;
        await bot.editMessageText(chatId, statusMsg.message_id, "Pairing request timed out or code generated. Check bot console.").catch(() => {});
      }
    }, 25000);

  } catch (e) {
    console.error('Pairing command execution error:', e);
    await bot.editMessageText(`Error: ${e.message}`, {
      chat_id: chatId,
      message_id: statusMsg.message_id
    }).catch(() => {});
  }
});
