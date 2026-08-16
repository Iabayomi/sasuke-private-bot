const fs = require('fs');
const path = require('path');

const commands = new Map();

// Load commands from commands directory
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  try {
    const cmd = require(`./commands/${file}`);
    if (cmd && cmd.name) {
      commands.set(cmd.name, cmd);
    } else if (typeof cmd === 'function') {
      const name = path.basename(file, '.js');
      commands.set(name, { execute: cmd, name });
    }
  } catch (e) {
    console.error(`Failed to load command ${file}:`, e.message);
  }
}

async function handleMessage(bad, m, store) {
  try {
    const body = m.body || m.text || '';
    const prefix = '.';
    if (!body.startsWith(prefix)) return;

    const args = body.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const text = args.join(' ');

    const command = commands.get(commandName);
    if (command && command.execute) {
      await command.execute(bad, m, args, text, store);
    } else if (commands.has(commandName)) {
      // Direct function execution
      await commands.get(commandName)(bad, m, args, text, store);
    }
  } catch (err) {
    console.error('Error in handleMessage:', err);
  }
}

module.exports = handleMessage;
