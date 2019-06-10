const { Command } = require('discord-akairo');

class ListChannelGroupsCommand extends Command {
  constructor() {
    super('listchannelgroups', {
      aliases: ['listchannelgroups', 'listchannelgroup', 'lcg'],
      channelRestriction: 'guild',
      userPermissions: ['MANAGE_CHANNELS']
    });
  }

  async exec(message, args) {
    let formatted = Object.values(this.client.getServer(message.guild.id).channelGroups)
      .map(channelGroup=>`\`${channelGroup.groupName}: ${channelGroup.channels.length}\``)
      .join(', ');
    return message.channel.send(`Channel groups: ${formatted}`);
  }
}

module.exports = ListChannelGroupsCommand;