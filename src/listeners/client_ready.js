const { Listener } = require('discord-akairo');

class ReadyListener extends Listener {
  constructor() {
    super('ready', {
      emitter: 'client',
      eventName: 'ready'
    });
  }

  async exec() {
    await this.client.loadData();
    await this.client.user.setActivity("r!help");
  }
}

module.exports = ReadyListener;