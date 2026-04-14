/**
 * Ola Core API
 * 
 * 环境无关的业务逻辑层，供 CLI、OpenClaw、Hermes 等环境共用。
 * 
 * 使用方式：
 *   const { OlaAPI } = require('./src/core/api');
 *   const api = new OlaAPI();
 *   await api.init();
 *   const docs = await api.scan('/Notes');
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { Config, Database } = require('../config');
const Scanner = require('../scanner');
const AIConfig = require('../ai/config');
const { TagGenerator } = require('./index');

class OlaAPI {
  constructor(options = {}) {
    this.options = options;
    this.config = new Config();
    this.database = new Database();
    this.aiConfig = new AIConfig(this.config);
    this.scanner = null;
    this.tagGenerator = null;
    this._initialized = false;
  }

  /**
   * 初始化，加载配置
   * @returns {object} 配置信息
   */
  init() {
    const cfg = this.config.load();
    if (!cfg) {
      return null;
    }
    this.scanner = new Scanner(cfg.vaultPath);
    this._initialized = true;
    return cfg;
  }

  /**
   * 获取配置
   */
  getConfig() {
    return this.config.load();
  }

  /**
   * 保存配置
   */
  saveConfig(cfg) {
    this.config.save(cfg);
    // 重新初始化 scanner
    this.scanner = new Scanner(cfg.vaultPath);
    this._initialized = true;
  }

  /**
   * 查找所有 Obsidian vault
   * @returns {Array} vault 列表
   */
  findVaults() {
    const vaults = [];
    const home = os.homedir();

    const possiblePaths = [
      // iCloud (macOS)
      path.join(home, 'Library/Mobile Documents/iCloud~md~obsidian/Documents'),
      // 本地 Documents
      path.join(home, 'Documents/Obsidian'),
      path.join(home, 'Documents/obsidian'),
      // Linux 常见路径
      path.join(home, 'Obsidian'),
      // Windows 常见路径
      path.join(home, 'OneDrive/Documents/Obsidian'),
    ];

    const seen = new Set();

    for (const basePath of possiblePaths) {
      if (fs.existsSync(basePath)) {
        try {
          const entries = fs.readdirSync(basePath, { withFileTypes: true });
          for (const entry of entries) {
            if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
            const vaultPath = path.join(basePath, entry.name);
            if (seen.has(vaultPath)) continue;
            seen.add(vaultPath);
            vaults.push({
              name: entry.name,
              path: vaultPath
            });
          }
        } catch (e) {
          // 忽略无法读取的目录
        }
      }
    }

    return vaults;
  }

  /**
   * 扫描文件夹中的所有文档
   * @param {string} folder - 文件夹路径，相对于 vault
   * @returns {Array} 文档列表
   */
  async scan(folder = '/') {
    this._ensureInitialized();
    return await this.scanner.scanFolder(folder);
  }

  /**
   * 筛选未打标的文档
   * @param {Array} docs - 文档列表
   * @returns {Array} 未打标文档
   */
  getUntagged(docs) {
    return docs.filter(doc => {
      const mtime = Math.floor(doc.mtime / 1000);
      return !this.database.isDocTagged(doc.relativePath, mtime);
    });
  }

  /**
   * 获取文档内容
   * @param {string} docPath - 文档路径
   * @returns {string} 文档内容
   */
  readDoc(docPath) {
    this._ensureInitialized();
    return this.scanner.readDoc(docPath);
  }

  /**
   * 为单个文档生成标签建议
   * @param {string} docPath - 文档路径
   * @returns {object} { existingTags, suggestedTags, summary }
   */
  async generateTags(docPath) {
    this._ensureInitialized();
    
    const fullPath = this.scanner.vaultPath.includes(docPath) 
      ? docPath 
      : path.join(this.scanner.vaultPath, docPath);
    
    const content = this.scanner.readDoc(fullPath);
    const existingTags = this.scanner.extractExistingTags(content);
    const existingAllTags = this.database.getAllTags();

    let suggestedTags = [];
    let summary = null;

    if (this.aiConfig.hasAIConfig()) {
      try {
        const generator = this.aiConfig.createTagGenerator({ maxTags: 5 });
        const result = await generator.generate(
          { path: docPath, content },
          { existingTags: existingAllTags, docTags: existingTags }
        );
        suggestedTags = result.tags || [];
        summary = result.summary || null;
      } catch (error) {
        // AI 生成失败，返回空建议
        console.error('AI generation error:', error.message);
      }
    }

    return {
      path: docPath,
      content: content,
      existingTags,
      suggestedTags,
      summary
    };
  }

  /**
   * 应用标签到文档
   * @param {string} docPath - 文档路径
   * @param {Array} tags - 标签数组
   * @param {string} position - 位置 'head' 或 'tail'
   * @returns {object} { success, tagCount }
   */
  applyTags(docPath, tags, position = 'tail') {
    this._ensureInitialized();

    const fullPath = this.scanner.vaultPath.includes(docPath)
      ? docPath
      : path.join(this.scanner.vaultPath, docPath);

    const content = this.scanner.readDoc(fullPath);
    const newContent = this.scanner.addTagsToDoc(content, tags, position);
    this.scanner.writeDoc(fullPath, newContent);

    // 更新数据库
    const mtime = Math.floor(fs.statSync(fullPath).mtimeMs / 1000);
    for (const tag of tags) {
      this.database.addTag(tag, path.relative(this.scanner.vaultPath, fullPath), mtime);
    }
    this.database.save();

    return {
      success: true,
      path: docPath,
      tags,
      tagCount: tags.length
    };
  }

  /**
   * 列出所有标签
   * @returns {Array} 标签列表
   */
  listTags() {
    const tags = this.database.getAllTags();
    return tags.map(tag => ({
      name: tag,
      docCount: this.database.getTagDocs(tag).length,
      docs: this.database.getTagDocs(tag)
    }));
  }

  /**
   * 重命名标签
   * @param {string} oldTag - 旧标签
   * @param {string} newTag - 新标签
   * @returns {object} { success, count }
   */
  renameTag(oldTag, newTag) {
    this._ensureInitialized();

    const docs = this.database.getTagDocs(oldTag);
    for (const docInfo of docs) {
      const fullPath = path.join(this.scanner.vaultPath, docInfo.path);
      const content = this.scanner.readDoc(fullPath);
      const newContent = this.scanner.renameTagInDoc(content, oldTag, newTag);
      this.scanner.writeDoc(fullPath, newContent);
    }

    // 更新数据库
    const oldTagData = this.database.data.tags[oldTag];
    this.database.data.tags[newTag] = oldTagData;
    delete this.database.data.tags[oldTag];
    this.database.save();

    return {
      success: true,
      oldTag,
      newTag,
      docCount: docs.length
    };
  }

  /**
   * 删除标签
   * @param {string} tag - 标签
   * @returns {object} { success, count }
   */
  deleteTag(tag) {
    this._ensureInitialized();

    const docs = this.database.getTagDocs(tag);
    for (const docInfo of docs) {
      const fullPath = path.join(this.scanner.vaultPath, docInfo.path);
      const content = this.scanner.readDoc(fullPath);
      const newContent = this.scanner.removeTagFromDoc(content, tag);
      this.scanner.writeDoc(fullPath, newContent);
    }

    // 从数据库删除
    this.database.removeTag(tag);
    this.database.save();

    return {
      success: true,
      tag,
      docCount: docs.length
    };
  }

  /**
   * 检查 AI 是否已配置
   */
  hasAI() {
    return this.aiConfig.hasAIConfig();
  }

  /**
   * 获取 AI 配置信息
   */
  getAIConfig() {
    if (!this.aiConfig.hasAIConfig()) {
      return null;
    }
    return {
      provider: this.aiConfig.getCurrentConfigString()
    };
  }

  _ensureInitialized() {
    if (!this._initialized) {
      const cfg = this.config.load();
      if (cfg) {
        this.scanner = new Scanner(cfg.vaultPath);
        this._initialized = true;
      } else {
        throw new Error('Ola not initialized. Call init() first or save config.');
      }
    }
  }
}

module.exports = { OlaAPI };
