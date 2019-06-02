const { Command } = require('discord-akairo');

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