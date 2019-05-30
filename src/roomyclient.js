const { AkairoClient } = require('discord-akairo');
const Database = require('./util/database');
const Server = require('./util/server');

const TOKEN = process.env.DISCORD_TOKEN;

class RoomyClient extends AkairoClient {
  constructor() {
    super({
      ownerID: '148611805445357569',
      prefix: 'r!',
      commandDirectory: './src/commands/',
      inhibitorDirectory: './src/inhibitors/',
      listenerDirectory: './src/listeners/'
    }, {
      disableEveryone: true
    });

    this.servers = {};
  }

  addServer(guildID) {
    this.servers[guildID] = new Server(this, guildID);
  }

  getServer(guildID) {
    return this.servers[guildID];
  }

  async loadData() {
    let guildIDs = await this.db.getGuildIDs();
    for (let guildID of guildIDs) {
      let server = new Server(this, guildID);
      this.servers[guildID] = server;
      this.servers[guildID].load();
    }
  }

  async start() {
    this.db = new Database();
    await this.db.init();
    return this.login(TOKEN);
  }
}

module.exports = RoomyClient;