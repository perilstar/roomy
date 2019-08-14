const ChannelGroup = require('./channel_group');

class Server {
  constructor(client, id) {
    this.client = client;
    this.id = id;
    this.channelGroups = {};
    this.adjustingChannelGroups = false;
  }

  async addChannelGroup(groupName, prefix, maxChannels, sourceChannelID) {
    let guild = this.client.guilds.get(this.id);
    let sourceChannel = guild.channels.get(sourceChannelID);
    let newChannelGroup = new ChannelGroup(guild, groupName, prefix, maxChannels, [sourceChannel]);

    this.channelGroups[groupName] = newChannelGroup;
    await this.save();
  }

  getChannelGroup(groupName) {
    return this.channelGroups[groupName];
  }

  getChannelGroupByID(channelID) {
    for (let groupName in this.channelGroups) {
      for (let channel of this.channelGroups[groupName].channels) {
        if (channel.id == channelID) {
          return this.channelGroups[groupName];
        }
      }
    }
    return null;
  }

  async removeChannelGroup(groupName) {
    delete this.channelGroups[groupName];
    await this.save();
  }
  
  channelGroupsNeedAdjusting() {
    for (let groupName in this.channelGroups) {
      if (this.getChannelGroup(groupName).channelsNeedAdjusting()) {
        return true;
      }
    }
    return false;
  }

  stageAdjustChannelGroups(adjustments) {
    for (let groupName in this.channelGroups) {
      adjustments = this.getChannelGroup(groupName).stageAdjustChannels(adjustments);
    }
    return adjustments;
  }

  async adjustChannelGroups(adjustments) {
    let promises = [];

    for (let groupName in this.channelGroups) {
      promises.push(this.getChannelGroup(groupName).adjustChannels(adjustments));
    }

    await Promise.all(promises);
  }

  async queueAdjustChannelGroups() {
    if (this.adjustingChannelGroups) {
      return;
    }
    this.adjustingChannelGroups = true;

    let adjustments = {
      shiftData: {},
      addToGroups: [],
      deletedChannels: []
    };

    adjustments = this.stageAdjustChannelGroups(adjustments);
    await this.adjustChannelGroups(adjustments);

    this.adjustingChannelGroups = false;
    // Needed in case someone joined or left a channel while we were adjusting
    if (this.channelGroupsNeedAdjusting()) {
      this.queueAdjustChannelGroups();
    }
    await this.save();
  }

  async save() {
    let storageObject = {};
    for (let groupName in this.channelGroups) {
      if (this.channelGroups[groupName].channels.length) {      
        storageObject[groupName] = this.channelGroups[groupName].getStorageObject();
      } else {
        delete this.channelGroups[groupName];
      }
    }
    await this.client.db.set(this.id, storageObject);
  }

  async load() {
    let storageObject = await this.client.db.get(this.id);
    let guild = this.client.guilds.get(this.id);

    for (let groupName in storageObject) {
      let data = storageObject[groupName];

      // filter for making sure the bot doesn't break if a channel is removed while it's offline
      let channels = data.channelIDs.map(channelID => guild.channels.get(channelID)).filter(Boolean);

      if (channels.length != data.channelIDs.length) {
        await this.save();
      }

      if (channels.length) {
        this.channelGroups[groupName] = new ChannelGroup(
          guild,
          groupName,
          data.prefix,
          data.maxChannels,
          channels
        );
      }
    }
    this.queueAdjustChannelGroups();
  }
}

module.exports = Server;