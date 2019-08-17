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
    this.parent = source.parent;
    this.categoryID = source.parentID || "root";
  }

  getSiblingChannels() {
    if (this.parent) return this.parent.children;
    // Now for channels outside of a category:
    return this.guild.channels.filter(channel=>!channel.parent && channel.type != "category");
  }

  async addChannel(position) {
    let channelData = {
      type: 'voice',
      bitrate: this.bitrate,
      userLimit: this.maxUsers,
      parent: this.parent,
      permissionOverwrites: this.perms,
      position: position
    };

    return this.guild.createChannel(`${this.prefix} ${this.channels.length + 1}`, channelData)
  }

  async removeChannel(channel) {
    if (!channel) return;

    // Yes, it's necessary that we do this here too, even though client_channelDelete handles this.
    // Otherwise, we couldn't really await this function. It's not a problem that we're doing it
    // twice though, because both times we're checking if index is -1 or not
    this.channels.splice(this.channels.indexOf(channel), 1);
    channel.delete();
  }

  renameChannels() {
    for(let i = 0; i < this.channels.length; i++) {
      if (this.channels[i].name != `${this.prefix} ${i + 1}`) {
        this.channels[i].edit({name: `${this.prefix} ${i + 1}`});
      }
    }
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

  stageAddChannel(shiftData, deletedChannels) {
    let remainingChannels = this.channels.filter(channel => !deletedChannels.includes(channel))
    let lastRemainingChannel = remainingChannels[remainingChannels.length - 1];

    let shiftOffset = (shiftData[lastRemainingChannel.id] || 0)
    let newPosition = lastRemainingChannel ? lastRemainingChannel.position + shiftOffset + 1 : 0;

    this.getSiblingChannels().forEach(channelToShift => {
      if (channelToShift.position + (shiftData[channelToShift.id] || 0) >= newPosition) {
        shiftData[channelToShift.id] = (shiftData[channelToShift.id] || 0) + 1;
      }
    });
  }

  stageRemoveChannel(channel, shiftData, deletedChannels) {
    if (!channel) return;
    if (deletedChannels.includes(channel)) return;
    this.getSiblingChannels().forEach(channelToShift => {
      if (channelToShift.position + (shiftData[channelToShift.id] || 0) > channel.position) {
        shiftData[channelToShift.id] = (shiftData[channelToShift.id] || 0) - 1;
      }
    });
    deletedChannels.push(channel);
  }

  stageAdjustChannels({shiftData, addToGroups, deletedChannels}) {
    // Loop through all but the last channel in the list backwards
    for(let i = this.channels.length - 2; i >= 0; i--) {
      // Stage deletion for any empty channels we see, as long as there are multiple channels
      if (!this.channels[i].members.size) {
        this.stageRemoveChannel(this.channels[i], shiftData, deletedChannels);
      }
    }

    // If needed, create a new channel
    let remainingChannels = this.channels.filter(channel => !deletedChannels.includes(channel))
    let lastRemainingChannel = remainingChannels[remainingChannels.length - 1];
    if (!lastRemainingChannel || (lastRemainingChannel.members.size && remainingChannels.length < this.maxChannels)) {
      this.stageAddChannel(shiftData, deletedChannels);
      addToGroups.push(this.groupName);
    }

    return {shiftData, addToGroups, deletedChannels};
  }

  async adjustChannels({shiftData, addToGroups, deletedChannels}) {
    let del = deletedChannels.map(channel => {
      this.removeChannel(channel);
    });

    let shifts = this.getSiblingChannels().map(channel => {
      let shift = shiftData[channel.id];
      if (shift) {
        return channel.edit({position: channel.position + shift});
      }
    });

    let add;
    if (addToGroups.includes(this.groupName)) {
      let remainingChannels = this.channels.filter(channel => !deletedChannels.includes(channel))
      let lastRemainingChannel = remainingChannels[remainingChannels.length - 1];
      let shiftOffset = (shiftData[lastRemainingChannel.id] || 0)
      let newPosition = lastRemainingChannel ? lastRemainingChannel.position + shiftOffset + 1 : 0;
      add = this.addChannel(newPosition);
    }
    
    let promises = [].concat(add, del, shifts);

    await Promise.all(promises)
      .then(values => {
        let newChannel = values[0];
        if (newChannel) this.channels.push(newChannel);
      });
    await this.renameChannels(deletedChannels);
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