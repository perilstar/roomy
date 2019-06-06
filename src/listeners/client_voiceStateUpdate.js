const { Listener } = require('discord-akairo');

class VoiceStateUpdateListener extends Listener {
  constructor() {
    super('voiceStateUpdate', {
      emitter: 'client',
      eventName: 'voiceStateUpdate'
    });

    this.deletingChannels = [];
  }

  async exec(oldUser, newUser) {
    let oldVC = oldUser.voiceChannel;
    let newVC = newUser.voiceChannel;

    if (oldVC) {
      let cg = this.client.getServer(oldVC.guild.id).getChannelGroupByID(oldVC.id);
      if (cg) {
        this.client.getServer(oldVC.guild.id).adjustChannelGroups();
      }
    }

    if (newVC) {
      let cg = this.client.getServer(newVC.guild.id).getChannelGroupByID(newVC.id);
      if (cg) {
        this.client.getServer(newVC.guild.id).adjustChannelGroups();
      }
    }
  }
}

module.exports = VoiceStateUpdateListener;