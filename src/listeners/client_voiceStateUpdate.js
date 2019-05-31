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
        await this.client.getServer(oldVC.guild.id).adjustChannelsInGroup(cg.groupName, false);
      }
    }

    if (newVC) {
      let cg = this.client.getServer(newVC.guild.id).getChannelGroupByID(newVC.id);
      if (cg) {
        await this.client.getServer(newVC.guild.id).adjustChannelsInGroup(cg.groupName, true);
      }
    }
  }

  // async handleDeleteChannel(channelGroup)
}

module.exports = VoiceStateUpdateListener;