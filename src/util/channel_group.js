// require('discord.js');

class ChannelGroup {
  constructor(guild, groupName, prefix, maxChannels, channels) {
    this.guild = guild;
    this.groupName = groupName;
    this.prefix = prefix;
    this.maxChannels = maxChannels;
    this.channels = channels;

    let source = this.channels[0];
    this.perms = source.permissionOverwrites;
    this.bitrate = source.bitrate * 1000;
    this.maxUsers = source.userLimit;
    this.category = source.parent;
  }

  async addChannel() {
    let channelData = {
      type: 'voice',
      bitrate: this.bitrate,
      userLimit: this.maxUsers,
      parent: this.category,
      permissionOverwrites: this.perms,
      position: this.channels[this.channels.length - 1].position + 1
    };

    let channelIDs = channelData.parent.children.keys();
    for (let channelID of channelIDs) {
      let channel = this.guild.channels.get(channelID);
      if (channel.position >= channelData.position) {
        await channel.edit({position: channel.position + 1});
      }
    }

    let newChannel = await this.guild.createChannel(`${this.prefix} ${this.channels.length + 1}`, channelData)
    this.channels.push(newChannel);
  }

  async removeChannel(channelID) {
    let index = this.channels.findIndex((channel) => channel.id == channelID);

    let channelIDs = this.channels[index].parent.children.keys();
    for (let channelID of channelIDs) {
      let channel = this.guild.channels.get(channelID);
      if (channel.position > this.channels[index].position) {
        await channel.edit({position: channel.position - 1});
      }
    }

    await this.channels[index].delete();
    // don't need to delete from the channels array here, as client_channelDelete.js takes care of that
  }

  async renameChannels() {
    for(let i = 0; i < this.channels.length; i++) {
      if (this.channels[i].name != `${this.prefix} ${i + 1}`) {
        this.channels[i].edit({name: `${this.prefix} ${i + 1}`});
      }
    }
  }

  getStorageObject() {
    return {
      prefix: this.prefix,
      maxChannels: this.maxChannels,
      channelIDs: this.channels.map(channel => channel.id)
    }
  }
}

module.exports = ChannelGroup;