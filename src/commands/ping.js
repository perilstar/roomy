const { Command } = require('discord-akairo');

class PingCommand extends Command {
  constructor() {
    super('ping', {
      aliases: ['ping']
    });
  }

  exec(message, args) {
    message.channel.send("Pong!");
  }
}

module.exports = PingCommand;