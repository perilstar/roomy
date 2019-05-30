const { Listener } = require('discord-akairo');

class VoiceStateUpdateListener extends Listener {
  constructor() {
    super('voiceStateUpdate', {
      emitter: 'client',
      eventName: 'voiceStateUpdate'
    });
  }

  async exec(oldUser, newUser) {
    let oldVC = oldUser.voiceChannel;
    let newVC = newUser.voiceChannel;

    if (oldVC && oldVC.members.size == 0) {
      let cg = this.client.getServer(oldVC.guild.id).getChannelGroupByID(oldVC.id);

      // don't delete the last channel!  
      if (cg && cg.channels.length > 1) {
        await this.client.getServer(oldVC.guild.id).removeChannelFromGroup(cg.groupName, oldVC.id);
      }
    }

    if (newVC && newVC.members.size == 1) {
      let cg = this.client.getServer(newVC.guild.id).getChannelGroupByID(newVC.id);

      // don't create more channels than allowed!
      if (cg && cg.channels.length < cg.maxChannels) {
        await this.client.getServer(newVC.guild.id).addChannelToGroup(cg.groupName);
      }
    }
  }
}

module.exports = VoiceStateUpdateListener;