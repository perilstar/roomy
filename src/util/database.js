const storage = require('node-persist');

class Database {
  async getGuildIDs() {
    return await storage.keys();
  }

  async set(guildID, storageObject) {
    await storage.setItem(guildID, storageObject);
  }

  async get(guildID) {
    return await storage.getItem(guildID);
  }

  async init() {
    await storage.init({
      dir: '.storage'
    });
  }
}

module.exports = Database;