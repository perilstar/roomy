const { Listener } = require('discord-akairo');

class VoiceStateUpdateListener extends Listener {
  constructor() {
    super('voiceStateUpdate', {
      emitter: 'client',
      eventName: 'voiceStateUpdate'
    });

    this.deletingChannels = [];
  }

  async handleChannelChange(vc) {
    if (vc) {
      let channelGroup = this.client.getServer(vc.guild.id).getChannelGroupByID(vc.id);
      if (!channelGroup) return;
      
      let categoryID = channelGroup.categoryID || "root";
      this.client.getServer(vc.guild.id).queueAdjustCategory(categoryID);
    }
  }

  async exec(oldUser, newUser) {
    this.handleChannelChange(oldUser.voiceChannel);
    this.handleChannelChange(newUser.voiceChannel);
  }
}

module.exports = VoiceStateUpdateListener;