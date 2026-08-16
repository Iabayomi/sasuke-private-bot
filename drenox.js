const fs = require('fs');
const path = require('path');
const axios = require('axios');
const yts = require('yt-search');
const config = require('./config');

const commands = new Map();

// Load commands from commands directory
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  try {
    const cmd = require(`./commands/${file}`);
    const name = path.basename(file, '.js').toLowerCase();
    if (typeof cmd === 'function') {
      commands.set(name, cmd);
    } else if (cmd && typeof cmd.execute === 'function') {
      commands.set(name, cmd.execute);
    } else if (cmd && typeof cmd.default === 'function') {
      commands.set(name, cmd.default);
    }
  } catch (e) {
    console.error(`Failed to load command ${file}:`, e.message);
  }
}

// In-memory economy database
const economy = {};
function getUser(userId) {
  if (!economy[userId]) {
    economy[userId] = { balance: 1000, bank: 5000, inventory: [] };
  }
  return economy[userId];
}

async function handleMessage(bad, m, store) {
  try {
    const body = m.body || m.text || '';
    const prefix = config.PREFIX || '.';
    if (!body.startsWith(prefix)) return;

    const args = body.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const text = args.join(' ');
    const sender = m.sender;
    const pushName = m.pushName || 'User';

    const reply = async (text) => {
      await bad.sendMessage(m.chat, { text }, { quoted: m });
    };

    // Economy & Special Sasuke Commands
    if (commandName === 'menu' || commandName === 'help') {
      const menuText = `╭ ⟨ *𝗞𝗜𝗡𝗚 𝗔𝗜* ◖ ᴠ𝟲.𝟬 ◗ ⟩ ✦
│ ⎋ ꜱʏꜱᴛᴇᴍ : ᴋᴏɴᴏʜᴀ_ᴄᴏʀᴇ
├────────────⬣
│ ❂ *ᴀʟʟ ᴄᴏᴍᴍᴀɴᴅꜱ*
│ ⟡ ᴘᴀᴛʜ :: _Rikudo — every path at once_
├────────────⬣
│ 🍃 ɢᴇɴᴇʀᴀʟ
│  ▸ .menu · .ping · .alive · .repo · .owner
├────────────⬣
│ ◈ ᴇᴄᴏɴᴏᴍʏ
│  ▸ .daily · .balance · .work · .gamble
├────────────⬣
│ ❂ ᴀɪ & ᴍᴇᴅɪᴀ
│  ▸ .ai · .gpt · .play · .tiktok · .ig
├────────────⬣
│ 🍃 ᴛᴏᴏʟꜱ (90+ MODULAR)
│  ▸ .sticker · .tts · .qr · .vv · .ss
╰───────────────────────────⬣
🔗 ${config.CHANNEL_LINK}`;
      return await bad.sendMessage(m.chat, { text: menuText }, { quoted: m });
    }

    if (commandName === 'daily') {
      const user = getUser(sender);
      user.balance += 500;
      return reply(`🎁 You claimed your daily reward of *$500*!`);
    }

    if (commandName === 'balance' || commandName === 'bal') {
      const user = getUser(sender);
      return reply(`💰 *Balance for ${pushName}*\n\nWallet: $${user.balance}\nBank: $${user.bank}`);
    }

    if (commandName === 'ai' || commandName === 'gpt') {
      if (!text) return reply('⚠️ Provide a prompt for AI!');
      try {
        const url = `https://text.pollinations.ai/${encodeURIComponent(text)}?referrer=google`;
        const res = await axios.get(url);
        return reply(`🤖 *Sasuke AI:*\n\n${res.data}`);
      } catch (e) {
        return reply('⚠️ AI service busy.');
      }
    }

    // Modular Commands Execution
    const command = commands.get(commandName);
    if (command) {
      // Pass arguments in the format expected by the modular commands
      // Modular commands in Queen AI typically take (sock, chatId, message, botStats)
      // Some might take (sock, chatId, message, args, text, store)
      // We'll try to be compatible
      try {
        await command(bad, m.chat, m, { totalGroups: 0, totalUsers: 0 });
      } catch (cmdErr) {
        console.error(`Error executing modular command ${commandName}:`, cmdErr);
      }
    }
  } catch (err) {
    console.error('Error in handleMessage:', err);
  }
}

module.exports = handleMessage;
