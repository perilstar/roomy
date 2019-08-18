class ChannelGroup {
  constructor(client, guild, groupName, prefix, maxChannels, channels) {
    this.client = client;
    this.guild = guild;
    this.groupName = groupName;
    this.prefix = prefix;
    this.maxChannels = maxChannels;
    this.channels = channels;

    let source = this.channels[0];
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

  checkPermissions({shiftData, addToGroups, deletedChannels}) {
    let hasAllPerms = true;
    let msgLines = [];
    msgLines.push("```");
    msgLines.push(`Roomy ran into issues on your server ${this.guild.name} in channel group ${this.groupName}.`);
    msgLines.push('');
    msgLines.push("Problems:");
    msgLines.push("---------");

    let remainingChannels = this.channels.filter(channel => !deletedChannels.includes(channel))

    // Addition of channels
    if (addToGroups[this.groupName]) {
      let newName = `${this.prefix} ${remainingChannels.length + 1}`;

      if (this.parent && !this.parent.permissionsFor(this.client.user).has('MANAGE_CHANNELS', true)) {
        hasAllPerms = false;
        msgLines.push(`Failed to create channel ${newName} in category ${this.parent.name}`);
      }
  
      if (!this.guild.members.get(this.client.user.id).hasPermission('MANAGE_CHANNELS')) {
        hasAllPerms = false;
        msgLines.push(`Failed to create channel ${newName}`);
      }  
    }
    
    // Deletion of channels
    for (let channel of deletedChannels) {
      if (!channel) continue;

      if (!channel.permissionsFor(this.client.user).has('MANAGE_CHANNELS', true)) {
        hasAllPerms = false;
        msgLines.push(`Failed to delete channel ${channel.name}`)
      }
    }

    // Shifting of channels
    for (let channel of this.getSiblingChannels()) {
      if (!channel) continue;

      if(shiftData[channel.id]) {
        if (!channel.permissionsFor(this.client.user).has('MANAGE_CHANNELS', true)) {
          hasAllPerms = false;
          msgLines.push(`Failed to delete channel ${channel.name}`)
        }
      }
    }

    // Renaming of channels
    for (let i = 0; i < remainingChannels.length; i++) {
      let channel = this.channels[i];
      if (channel.name != `${this.prefix} ${i + 1}`) {
        if (!channel.permissionsFor(this.client.user).has('MANAGE_CHANNELS', true)) {
          hasAllPerms = false;
          msgLines.push(`Failed to rename channel ${channel.name} to ${this.prefix} ${i + 1}`);
        }
      }
    }

    msgLines.push('')
    msgLines.push("You should check to make sure that you don't have any extra permission overwrites for the channels or the categories they're in.");
    msgLines.push("```");

    let message = msgLines.join('\n');
    return {hasAllPerms, message}
  }

  async addChannel(position) {
    let remainingChannels = this.channels.filter(channel => !deletedChannels.includes(channel))

    let newName = `${this.prefix} ${remainingChannels.length + 1}`;
    let channelData = {
      type: 'voice',
      bitrate: this.bitrate,
      userLimit: this.maxUsers,
      parent: this.parent,
      permissionOverwrites: this.channels[0].permissionOverwrites,
      position: position
    };

    return this.guild.createChannel(newName, channelData)
  }

  async removeChannel(channel) {
    if (!channel) return;

    // Yes, it's necessary that we do this here too, even though client_channelDelete handles this.
    // Otherwise, we couldn't really await this function. It's not a problem that we're doing it
    // twice though, because both times we're checking if index is -1 or not
    this.channels.splice(this.channels.indexOf(channel), 1);
    channel.delete();
  }

  async shiftChannel(channel, relativePosition) {
    if (!channel) return;
    return channel.edit({position: channel.position + relativePosition});
  }

  renameChannels(deletedChannels) {
    let remainingChannels = this.channels.filter(channel => !deletedChannels.includes(channel))

    for (let i = 0; i < remainingChannels.length; i++) {
      let channel = this.channels[i];
      if (channel.name != `${this.prefix} ${i + 1}`) {
        remainingChannels[i].edit({name: `${this.prefix} ${i + 1}`});
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

  stageAdjustChannels(adjustments) {
    let {shiftData, addToGroups, deletedChannels} = adjustments;
    // Loop through all but the last channel in the list backwards
    for (let i = this.channels.length - 2; i >= 0; i--) {
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

  async adjustChannels(adjustments) {
    let {shiftData, addToGroups, deletedChannels} = adjustments;
    let {hasAllPerms, message} = this.checkPermissions(adjustments);

    if (!hasAllPerms) {
      this.guild.owner.send(message);
      return false;
    }

    let deletions = deletedChannels.map(channel => {
      this.removeChannel(channel);
    });

    let shifts = this.getSiblingChannels().map(channel => {
      let shift = shiftData[channel.id];
      if (shift) {
        this.shiftChannel(channel, shift);
      }
    });

    let additions;
    if (addToGroups.includes(this.groupName)) {
      let remainingChannels = this.channels.filter(channel => !deletedChannels.includes(channel))
      let lastRemainingChannel = remainingChannels[remainingChannels.length - 1];
      let shiftOffset = (shiftData[lastRemainingChannel.id] || 0)
      let newPosition = lastRemainingChannel ? lastRemainingChannel.position + shiftOffset + 1 : 0;
      add = this.addChannel(newPosition);
    }
    
    let renames = this.renameChannels(deletedChannels);

    let promises = [].concat(additions, deletions, shifts, renames);

    await Promise.all(promises)
      .then(values => {
        let newChannel = values[0];
        if (newChannel) this.channels.push(newChannel);
      });
      
    return true;
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