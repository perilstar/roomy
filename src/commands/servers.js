const { Command } = require('discord-akairo');
const storage = require('node-persist');
const ChannelGroup = require('../util/channel_group');

class ServersCommand extends Command {
  constructor() {
    super('servers', {
      aliases: ['servers'],
      ownerOnly: true
    });
  }

  async exec(message) {
    let serverCount = await this.client.guilds.size;
    return message.channel.send("Servers: " + serverCount);
  }
}

module.exports = ServersCommand;