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
  await fs.ensureDir(sessionDir);
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  const bad = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: Browsers.macOS('Desktop')
  });

  bad.ev.on('creds.update', saveCreds);

  bad.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log('Connection closed due to:', lastDisconnect?.error);
      // Auto reconnect
      setTimeout(() => startpairing(phoneNumber, respCallback), 3000);
    } else if (connection === 'open') {
      console.log('WhatsApp connection opened successfully.');
    }
  });

  if (!state.creds.registered) {
    setTimeout(async () => {
      try {
        let code = await bad.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ''));
        code = code?.match(/.{1,4}/g)?.join('-') || code;
        if (respCallback) respCallback({ success: true, code });
      } catch (e) {
        console.error('Pairing code error:', e);
        if (respCallback) respCallback({ success: false, error: e.message });
      }
    }, 4000);
  }

  bad.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const mek of messages) {
      if (!mek.message) continue;
      // Simple serialization
      const m = {
        key: mek.key,
        chat: mek.key.remoteJid,
        sender: mek.key.participant || mek.key.remoteJid,
        body: mek.message.conversation || mek.message.extendedTextMessage?.text || '',
        pushName: mek.pushName,
        message: mek.message
      };
      await handleMessage(bad, m, null);
    }
  });

  return bad;
}

module.exports = { startpairing };
