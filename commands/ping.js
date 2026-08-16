const os = require('os');
const settings = require('../settings.js');

/* 🎨 Deux images aléatoires pour le ping */
const pingImages = [
    "https://images.iimg.live/images/fantastic-capture-1426.webp",
    "https://images.iimg.live/images/amazing-snap-7301.webp"
];

/* 🌟 Helper pour image random */
const getRandomImage = () => pingImages[Math.floor(Math.random() * pingImages.length)];

/* 📰 Newsletter context pour WhatsApp */
const newsletterContext = (imageUrl) => ({
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363421176303484@newsletter',
        newsletterName: 'Sasuke Private Bot',
        serverMessageId: Math.floor(Math.random() * 1000)
    },
    externalAdReply: {
        title: "༺✿ ǫᴜᴇᴇɴ ᴀɪ SYSTEM ✿༻",
        body: "Tap to view our official channel",
        thumbnailUrl: imageUrl,
        mediaType: 1,
        renderLargerThumbnail: true,
        sourceUrl: "https://whatsapp.com/channel/0029Vb8zve99sBI37uVER11q"
    }
});

/* ⏱ Format du temps pour l’uptime */
function formatTime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds %= 24 * 60 * 60;
    const hours = Math.floor(seconds / (60 * 60));
    seconds %= 60 * 60;
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);

    return `${days ? days + 'd ' : ''}${hours ? hours + 'h ' : ''}${minutes ? minutes + 'm ' : ''}${seconds}s`.trim();
}

/* 🎬 Commande PING - QUEEN AI Clean Style */
async function pingCommand(sock, chatId, message, botStats = {}) {
    try {
        const start = Date.now();
        await sock.sendMessage(chatId, { text: '🏓 Pong!' }, { quoted: message });
        const ping = Math.round((Date.now() - start) / 2);

        const uptimeFormatted = formatTime(process.uptime());
        const now = new Date();
        const time = now.toLocaleTimeString('en-GB', { timeZone: 'Africa/Douala' });
        const date = now.toLocaleDateString('en-GB', { timeZone: 'Africa/Douala' });

        const totalGroups = botStats.totalGroups || "N/A";
        const totalUsers  = botStats.totalUsers  || "N/A";

        const randomImage = getRandomImage();

        const botInfo = `
╔═『 👑 ǫᴜᴇᴇɴ ᴀɪ 』═╗
┃ 🏓 Ping      : ${ping} ms
┃ ⏱ Uptime    : ${uptimeFormatted}
┃ ⚙ Version   : v${settings.version}
╚═════════════╝

╭─〔 📊 BOT STATS 〕─╮
┃ 👥 Groups    : ${totalGroups}
┃ 🧍 Users     : ${totalUsers}
┃ 🖥 Platform  : ${os.platform()} ${os.arch()}
┃ 🕒 Date/Time : ${date} ${time}
╰─────────────────╯

╭─〔 👑 POWERED BY 〕─╮
┃ BLACK KING NEMESIS
┃ Elite Bot Architecture
╰─────────────────╯

Official Channel:
https://whatsapp.com/channel/0029Vb8zve99sBI37uVER11q
`;

        await sock.sendMessage(chatId, {
            image: { url: randomImage },
            caption: botInfo,
            mentions: [message.key?.participant || chatId],
            contextInfo: newsletterContext(randomImage)
        }, { quoted: message });

    } catch (error) {
        console.error('Error in ping command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to get bot status.' }, { quoted: message });
    }
}

module.exports = pingCommand;