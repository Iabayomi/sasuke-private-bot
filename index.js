const express = require('express');
const app = express();
const PORT = process.env.PORT || 8000;

app.get('/', (req, res) => {
  res.send('Sasuke Private Bot is running 24/7!');
});

app.listen(PORT, () => {
  console.log(`🌐 Sasuke Private Bot web server running on port ${PORT}`);
});

// Start Telegram Bot
require('./bot.js');

// Error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});
