const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  Browsers
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs-extra');
const path = require('path');
const handleMessage = require('./drenox.js');

const sessionDir = path.join(__dirname, 'auth_info_baileys');

async function startpairing(phoneNumber, respCallback) {
  try {
    await fs.ensureDir(sessionDir);
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: Browsers.macOS('Chrome')
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode;
        console.log('WhatsApp connection closed, reason:', reason);
        if (reason !== DisconnectReason.loggedOut) {
          setTimeout(() => startpairing(phoneNumber, null), 5000);
        }
      } else if (connection === 'open') {
        console.log('WhatsApp connection opened successfully!');
      }
    });

    if (!state.creds.registered) {
      setTimeout(async () => {
        try {
          const cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');
          console.log(`Requesting pairing code for: ${cleanedNumber}`);
          let code = await sock.requestPairingCode(cleanedNumber);
          code = code?.match(/.{1,4}/g)?.join('-') || code;
          if (respCallback) {
            respCallback({ success: true, code });
            respCallback = null; // Prevent double callback
          }
        } catch (e) {
          console.error('Pairing code generation error:', e);
          if (respCallback) {
            respCallback({ success: false, error: e.message });
            respCallback = null;
          }
        }
      }, 5000);
    } else {
      if (respCallback) {
        respCallback({ success: false, error: 'Session already registered. Delete auth_info_baileys to re-pair.' });
        respCallback = null;
      }
    }

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;
      for (const mek of messages) {
        if (!mek.message) continue;
        const m = {
          key: mek.key,
          chat: mek.key.remoteJid,
          sender: mek.key.participant || mek.key.remoteJid,
          body: mek.message.conversation || mek.message.extendedTextMessage?.text || '',
          pushName: mek.pushName,
          message: mek.message
        };
        try {
          await handleMessage(sock, m, null);
        } catch (err) {
          console.error('Error handling message:', err);
        }
      }
    });

    return sock;
  } catch (err) {
    console.error('Fatal error in startpairing:', err);
    if (respCallback) respCallback({ success: false, error: err.message });
  }
}

module.exports = { startpairing };
