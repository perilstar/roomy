const ChannelGroup = require('./channel_group');

class Server {
  constructor(client, id) {
    this.client = client;
    this.id = id;
    this.channelGroups = {};
    // Which categories we're currently dispatching adjustments for
    this.adjustingCategories = [];
    // Timer handles for each category
    this.categoryTimers = {};
    // Lookup for category to groups
    this.categoryMap = {};
  }

  async addChannelGroup(groupName, prefix, maxChannels, sourceChannelID) {
    let guild = this.client.guilds.get(this.id);
    let sourceChannel = guild.channels.get(sourceChannelID);
    let newChannelGroup = new ChannelGroup(guild, groupName, prefix, maxChannels, [sourceChannel]);

    this.channelGroups[groupName] = newChannelGroup;

    this.addToCategoryMap(newChannelGroup);

    await this.save();
  }

  addToCategoryMap(channelGroup) {
    if (!this.categoryMap[channelGroup.categoryID]) this.categoryMap[channelGroup.categoryID] = [];
    this.categoryMap[channelGroup.categoryID].push(channelGroup);
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

  // getChannelGroupsInCategory(categoryID) {
  //   return Object.keys(this.channelGroups).filter(groupName => this.channelGroups[groupName].category == categoryID);
  // }

  async removeChannelGroup(groupName) {
    delete this.channelGroups[groupName];
    for (let categoryID in this.categoryMap) {
      let index = this.categoryMap[categoryID].findIndex(channelGroup => channelGroup.groupName == groupName);
      if (index != -1) {
        this.categoryMap[categoryID].splice(index, 1);
        break;
      }
    }

    await this.save();
  }
  
  categoryNeedsAdjusting(categoryID) {
    return this.categoryMap[categoryID].some(channelGroup => channelGroup.channelsNeedAdjusting());
  }

  stageAdjustGroupSet(groupSet) {
    let adjustments = {
      shiftData: {},
      addToGroups: [],
      deletedChannels: []
    };
    return groupSet.reduce((adjustmentsAccumulator, channelGroup) => channelGroup.stageAdjustChannels(adjustmentsAccumulator), adjustments)
  }

  async adjustGroupSet(groupSet, adjustments) {
    await Promise.all(groupSet.map(channelGroup=>channelGroup.adjustChannels(adjustments)));
  }

  async adjustCategoryImmediately(categoryID) {
    if (this.adjustingCategories.includes(categoryID)) return;
    this.adjustingCategories.push(categoryID);

    let groupSet = this.categoryMap[categoryID];

    let adjustments = this.stageAdjustGroupSet(groupSet);
    await this.adjustGroupSet(groupSet, adjustments); 

    this.adjustingCategories.splice(this.adjustingCategories.indexOf(categoryID), 1);
    delete this.categoryTimers[categoryID];

    // Needed in case someone joined or left a channel while we were adjusting
    if (this.categoryNeedsAdjusting(categoryID)) {
      this.queueAdjustCategory(categoryID);
    }
    await this.save();
  }

  async queueAdjustCategory(categoryID) {
    if (this.categoryTimers[categoryID]) clearTimeout(this.categoryTimers[categoryID]);
    this.categoryTimers[categoryID] = setTimeout(() => this.adjustCategoryImmediately(categoryID), 2000);
  }

  async adjustAllCategoriesImmediately() {
    for (let categoryID in this.categoryMap) {
      this.adjustCategoryImmediately(categoryID);
    }
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
        let cg = new ChannelGroup(
          guild,
          groupName,
          data.prefix,
          data.maxChannels,
          channels
        );
        this.channelGroups[groupName] = cg;
        this.addToCategoryMap(cg);
      }
    }
    this.adjustAllCategoriesImmediately();
  }
}

module.exports = Server;