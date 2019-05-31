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
    let servers = await this.client.db.getGuildIDs();
    let serverCount = servers.length;
    return message.channel.send("Servers: " + serverCount);
  }
}

module.exports = ServersCommand;