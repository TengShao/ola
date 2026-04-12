const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_DIR = path.join(os.homedir(), '.hermes', 'skills', 'ola');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const DATABASE_FILE = path.join(CONFIG_DIR, 'tag-database.json');

class Config {
  constructor() {
    this.ensureConfigDir();
  }

  ensureConfigDir() {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
  }

  load() {
    if (!fs.existsSync(CONFIG_FILE)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  }

  save(config) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  }

  exists() {
    return fs.existsSync(CONFIG_FILE);
  }

  delete() {
    if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE);
    }
  }
}

class Database {
  constructor() {
    this.ensureConfigDir();
    this.data = this.load();
  }

  ensureConfigDir() {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
  }

  load() {
    if (!fs.existsSync(DATABASE_FILE)) {
      return { tags: {} };
    }
    return JSON.parse(fs.readFileSync(DATABASE_FILE, 'utf8'));
  }

  save() {
    fs.writeFileSync(DATABASE_FILE, JSON.stringify(this.data, null, 2));
  }

  addTag(tagName, docPath, mtime) {
    if (!this.data.tags[tagName]) {
      this.data.tags[tagName] = { docs: [] };
    }
    
    const existingIndex = this.data.tags[tagName].docs.findIndex(
      d => d.path === docPath
    );
    
    if (existingIndex >= 0) {
      this.data.tags[tagName].docs[existingIndex].mtime = mtime;
    } else {
      this.data.tags[tagName].docs.push({ path: docPath, mtime });
    }
  }

  removeTag(tagName) {
    delete this.data.tags[tagName];
  }

  getAllTags() {
    return Object.keys(this.data.tags).sort((a, b) => {
      const countA = this.data.tags[a].docs.length;
      const countB = this.data.tags[b].docs.length;
      return countB - countA;
    });
  }

  getTagDocs(tagName) {
    return this.data.tags[tagName]?.docs || [];
  }

  clear() {
    this.data = { tags: {} };
    this.save();
  }

  isDocTagged(docPath, mtime) {
    for (const tagName of Object.keys(this.data.tags)) {
      const doc = this.data.tags[tagName].docs.find(d => d.path === docPath);
      if (doc && doc.mtime === mtime) {
        return true;
      }
    }
    return false;
  }
}

module.exports = { Config, Database, CONFIG_DIR };
