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
    this.categoryID = source.parent.id;
  }

  async addChannel() {

    let channelData = {
      type: 'voice',
      bitrate: this.bitrate,
      userLimit: this.maxUsers,
      parent: this.guild.channels.get(this.categoryID),
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

    if (index != -1) {
      let channelIDs = this.channels[index].parent.children.keys();
      for (let channelID of channelIDs) {
        let channel = this.guild.channels.get(channelID);
        if (channel.position > this.channels[index].position) {
          await channel.edit({position: channel.position - 1});
        }
      }

      let channel = this.channels[index];

      // Yes, it's necessary that we do this here too, even though client_channelDelete handles this.
      // Otherwise, we couldn't really await this function. It's not a problem that we're doing it
      // twice though, because both times we're checking if index is -1 or not
      this.channels.splice(index, 1);
      await channel.delete();

    }
  }

  renameChannels() {
    for(let i = 0; i < this.channels.length; i++) {
      if (this.channels[i].name != `${this.prefix} ${i + 1}`) {
        this.channels[i].edit({name: `${this.prefix} ${i + 1}`});
      }
    }
  }

  getLastChannel() {
    return this.channels[this.channels.length - 1];
  }

  channelsNeedAdjusting() {
    for (let i = 0; i < this.channels.length - 1; i++) {
      if (!this.channels[i].members.size) {
        return true;
      }
    }
    if (this.channels[this.channels.length - 1].members.size && this.channels.length < this.maxChannels) {
      return true;
    }
    return false;
  }

  async adjustChannels() {
    
    // Loop through all but the last channel in the list backwards
    for(let i = this.channels.length - 2; i >= 0; i--) {
      // Delete any empty channels we see, as long as there are multiple channels
      if (!this.channels[i].members.size) {
        await this.removeChannel(this.channels[i].id);
      }
    }
    // If needed, create a new channel
    if (this.getLastChannel().members.size && this.channels.length < this.maxChannels) {
      await this.addChannel()
    }
    this.renameChannels();
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