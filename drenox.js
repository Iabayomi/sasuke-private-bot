const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs-extra');

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
    const prefix = '.';
    if (!body.startsWith(prefix)) return;

    const args = body.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const text = args.join(' ');
    const sender = m.sender;
    const pushName = m.pushName || 'User';

    const reply = async (text) => {
      await bad.sendMessage(m.chat, { text }, { quoted: m });
    };

    switch (command) {
      case 'menu':
      case 'help':
      case 'start': {
        const menuText = `╭ ⟨ *𝗞𝗜𝗡𝗚 𝗔𝗜* ◖ ᴠ𝟲.𝟬 ◗ ⟩ ✦
│ ⎋ ꜱʏꜱᴛᴇᴍ : ᴋᴏɴᴏʜᴀ_ᴄᴏʀᴇ
├────────────⬣
│ ❂ *ᴀʟʟ ᴄᴏᴍᴍᴀɴᴅꜱ*
│ ⟡ ᴘᴀᴛʜ :: _Rikudo — every path at once_
├────────────⬣
│ 🍃 ɢᴇɴᴇʀᴀʟ
│  ▸ .menu · .assist · .lang · .about
│  ▸ .ping · .alive · .repo · .owner · .pair
├────────────⬣
│ ◈ ᴇᴄᴏɴᴏᴍʏ
│  ▸ .daily · .balance · .work · .deposit
│  ▸ .withdraw · .give · .baltop · .rob
│  ▸ .slots · .gamble · .shop · .buy · .inventory
├────────────⬣
│ ⚡ ɢᴀᴍᴇꜱ
│  ▸ .rps · .guess · .hangman · .8ball
│  ▸ .coinflip · .roll · .fact · .wyr · .rate · .ttt
├────────────⬣
│ ❂ ᴀɪ & ᴍᴜꜱɪᴄ
│  ▸ .ai <query> · .gpt <query> · .play <song>
├────────────⬣
│ 🍃 ᴛᴏᴏʟꜱ
│  ▸ .sticker · .tts · .translate · .qr · .styletext
╰───────────────────────────⬣
   *ʙʏ ꜱᴀꜱᴜᴋᴇ ᴘʀɪᴠᴀᴛᴇ ʙᴏᴛ*
🔗 https://whatsapp.com/channel/0029Vb8zve99sBI37uVER11q`;
        await bad.sendMessage(m.chat, {
          image: { url: 'https://files.catbox.moe/2z6ht6.mp4' }, // or static image
          caption: menuText
        }, { quoted: m }).catch(() => reply(menuText));
        break;
      }

      case 'ping': {
        const start = Date.now();
        await reply('Pong!');
        const latency = Date.now() - start;
        await reply(`⚡ Response Speed: *${latency}ms*`);
        break;
      }

      case 'ai':
      case 'gpt': {
        if (!text) return reply('⚠️ Provide a prompt for AI!\nExample: .ai Hello Sasuke');
        await bad.sendMessage(m.chat, { react: { text: '🤖', key: m.key } });
        try {
          const url = `https://text.pollinations.ai/${encodeURIComponent('You are Sasuke Private Bot, a powerful and elite AI assistant. ' + text)}?referrer=google`;
          const res = await axios.get(url);
          let ans = res.data;
          if (typeof ans === 'string') {
            await reply(`🤖 *Sasuke AI:*\n\n${ans}`);
          } else {
            await reply('❌ AI response error.');
          }
        } catch (e) {
          await reply('⚠️ AI service busy. Try again later.');
        }
        break;
      }

      case 'play':
      case 'song': {
        if (!text) return reply('🎵 Provide a song name!\nExample: .play Komang');
        await bad.sendMessage(m.chat, { react: { text: '🎶', key: m.key } });
        try {
          const search = await yts(text);
          if (!search.videos.length) return reply('❌ No results found.');
          const video = search.videos[0];

          const { ytmp3 } = require('@vreden/youtube_scraper');
          const ytRes = await ytmp3(video.url);
          if (!ytRes.status || !ytRes.download?.url) throw new Error('Download failed');

          await bad.sendMessage(m.chat, {
            audio: { url: ytRes.download.url },
            mimetype: 'audio/mpeg',
            fileName: `${ytRes.metadata.title}.mp3`,
            contextInfo: {
              externalAdReply: {
                title: ytRes.metadata.title,
                body: video.author?.name || 'Sasuke Private Bot',
                thumbnailUrl: video.thumbnail,
                sourceUrl: video.url,
                mediaType: 1,
                renderLargerThumbnail: true
              }
            }
          }, { quoted: m });
          await bad.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        } catch (e) {
          await reply('⚠️ Failed to download audio.');
        }
        break;
      }

      case 'balance':
      case 'bal': {
        const user = getUser(sender);
        await reply(`💰 *Balance for ${pushName}*\n\nWallet: $${user.balance}\nBank: $${user.bank}`);
        break;
      }

      case 'daily': {
        const user = getUser(sender);
        user.balance += 500;
        await reply(`🎁 You claimed your daily reward of *$500*!`);
        break;
      }

      case 'work': {
        const user = getUser(sender);
        const earned = Math.floor(Math.random() * 200) + 50;
        user.balance += earned;
        await reply(`💼 You worked as a Konoha Ninja and earned *$${earned}*!`);
        break;
      }

      case 'gamble':
      case 'slots': {
        const user = getUser(sender);
        const bet = parseInt(args[0]) || 100;
        if (user.balance < bet) return reply('❌ You do not have enough money in your wallet!');
        
        const win = Math.random() > 0.5;
        if (win) {
          user.balance += bet;
          await reply(`🎰 You won *$${bet}*! 🎉\nNew Balance: $${user.balance}`);
        } else {
          user.balance -= bet;
          await reply(`🎰 You lost *$${bet}*! 😢\nNew Balance: $${user.balance}`);
        }
        break;
      }

      default:
        // Ignore unrecognized commands silently or give a hint
        break;
    }
  } catch (err) {
    console.error('Error in handleMessage:', err);
  }
}

module.exports = handleMessage;
