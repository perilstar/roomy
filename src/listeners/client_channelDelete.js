const { Listener } = require('discord-akairo');

class ChannelDeleteListener extends Listener {
  constructor() {
    super('channelDelete', {
      emitter: 'client',
      eventName: 'channelDelete'
    });
  }

  async exec(channel) {
    let cg = this.client.getServer(channel.guild.id).getChannelGroupByID(channel.id)
    if (cg) {
      let index = cg.channels.indexOf(channel);
      if (index != -1) {
        cg.channels.splice(index, 1);
      }
      await cg.adjustChannels();
      await this.client.getServer(channel.guild.id).save();
    }
  }
}

module.exports = ChannelDeleteListener;