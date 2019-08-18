const { Command } = require('discord-akairo');

class CreateChannelGroupCommand extends Command {
  constructor() {
    super('createchannelgroup', {
      aliases: ['createchannelgroup', 'ccg'],
      split: 'quoted',
      channelRestriction: 'guild',
      userPermissions: ['MANAGE_CHANNELS'],
      args: [
        {
          id: 'groupName',
          type: 'string'
        },
        {
          id: 'sourceChannel',
          type: 'string',
        },
        {
          id: 'prefix',
          type: 'string'
        },
        {
          id: 'maxChannels',
          type: 'number'
        }
      ]
    });
  }

  async exec(message, args) {
    if (!args.groupName) {
      return message.channel.send(`Error: Missing argument: \`groupName\`. Use r!help for commands.`);
    }
    if (!args.sourceChannel) {
      return message.channel.send(`Error: Missing argument: \`sourceChannel\`. Use r!help for commands.`);
    }
    if (!args.prefix) {
      return message.channel.send(`Error: Missing argument: \`prefix\`. Use r!help for commands.`);
    }
    if (!args.maxChannels) {
      return message.channel.send(`Error: Missing argument: \`maxChannels\`. Use r!help for commands.`);
    }

    if (this.client.getServer(message.guild.id).getChannelGroup(args.groupName)) {
      return message.channel.send(`Error: Channel group \`${args.groupName}\` already exists!`);
    }
    let cg = this.client.getServer(message.guild.id).getChannelGroupByID(args.sourceChannel)
    if (cg) {
      return message.channel.send(`Error: Channel group \`${cg.groupName}\` already contains the source channel you chose!`);
    }

    if (!message.guild.channels.has(args.sourceChannel)) {
      return message.channel.send(`Error: Channel \`${args.sourceChannel}\` does not exist!`);
    }
    if (message.guild.channels.get(args.sourceChannel).type != 'voice') {
      return message.channel.send(`Error: \`${args.sourceChannel}\` is not a voice channel!`);
    }

    if (!message.guild.channels.get(args.sourceChannel).permissionsFor(this.client.user).has('MANAGE_CHANNELS', true)) {
      return message.channel.send(`Error: I don't have manage channel permissions for that channel! Check overwrites for the channel and category.`);
    }

    await this.client.getServer(message.guild.id).addChannelGroup(
      args.groupName,
      args.prefix,
      args.maxChannels,
      args.sourceChannel
    );
    return message.channel.send(`Success! Created channel group \`${args.groupName}\``);
  }
}

module.exports = CreateChannelGroupCommand;