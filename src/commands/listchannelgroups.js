const { Command } = require('discord-akairo');
const storage = require('node-persist');
const ChannelGroup = require('../util/channel_group');

class ListChannelGroupsCommand extends Command {
  constructor() {
    super('listchannelgroups', {
      aliases: ['listchannelgroups', 'listchannelgroup', 'lcg'],
      channelRestriction: 'guild',
      userPermissions: ['ADMINISTRATOR']
    });
  }

  async exec(message, args) {
    let formatted = Object.keys(this.client.getServer(message.guild.id).channelGroups).map(str=>`\`${str}\``).join(', ');
    return message.channel.send(`Channel groups: ${formatted}`);
  }
}

module.exports = ListChannelGroupsCommand;