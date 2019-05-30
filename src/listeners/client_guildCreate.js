const { Listener } = require('discord-akairo');

class GuildCreateListener extends Listener {
  constructor() {
    super('guildCreate', {
      emitter: 'client',
      eventName: 'guildCreate'
    });
  }

  async exec(guild) {
    if (!this.client.getServer(guild.id)) {
      await this.client.addServer(guild.id);
    }
  }
}

module.exports = GuildCreateListener;