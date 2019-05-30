const { Command } = require('discord-akairo');
const storage = require('node-persist');
const ChannelGroup = require('../util/channel_group');

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