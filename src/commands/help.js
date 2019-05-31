const { Command } = require('discord-akairo');
const storage = require('node-persist');
const ChannelGroup = require('../util/channel_group');
const Discord = require('discord.js');

class HelpCommand extends Command {
  constructor() {
    super('help', {
      aliases: ['help', 'about', 'commands']
    });
  }

  async exec(message, args) {
    let avatarURL = await this.client.fetchUser('148611805445357569').avatarURL;

    let embed = new Discord.RichEmbed()
      .setColor('#348bbe')
      .setTitle('Roomy - Rooms management Discord bot')
      .setURL('https://github.com/perilstar/roomy')
      .setThumbnail(this.client.user.avatarURL)
      .addField('Commands', '--------------')
      .addField(
        'r!ccg [groupName] [sourceChannel] [prefix] [maxChannels]', 
        [
          'Creates a channel group named `[groupName]`, copying data',
          'from `[sourceChannel]`, with channel prefix `[prefix]`, that',
          'can have up to `[maxChannels]` channels.'
        ]
      )
      .addField('r!lcg', 'Lists all channel groups by group name.')
      .addField('r!dcg', 'Deletes a channel group by group name.')
      .addBlankField()
      .addField('Want to help support me? Donate:', 'https://paypal.me/perilstar')
      .setFooter('v1.0.0 by perilstar');

    return message.channel.send(embed);
  }
}

module.exports = HelpCommand;