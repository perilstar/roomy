const { Command } = require('discord-akairo');

class DeleteChannelGroupCommand extends Command {
  constructor() {
    super('deletechannelgroup', {
      aliases: ['deletechannelgroup', 'dcg'],
      split: 'quoted',
      channelRestriction: 'guild',
      userPermissions: ['MANAGE_CHANNELS'],
      args: [
        {
          id: 'groupName',
          type: 'string'
        }
      ]
    });
  }

  async exec(message, args) {
    if (!args.groupName) {
      return message.channel.send(`Error: Missing argument: \`groupName\`. Use r!help for commands.`);
    }

    if (!this.client.getServer(message.guild.id).getChannelGroup(args.groupName)) {
      return message.channel.send(`Error: Channel group \`${args.groupName}\` does not exist!`)
    }

    await this.client.getServer(message.guild.id).removeChannelGroup(args.groupName);
    return message.channel.send(`Success! Deleted channel group \`${args.groupName}\``);
  }
}

module.exports = DeleteChannelGroupCommand;