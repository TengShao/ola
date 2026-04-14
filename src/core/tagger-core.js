const fs = require('fs');
const path = require('path');

/**
 * Tagger 核心逻辑（适配器版本）
 * 与 UI 无关的纯业务逻辑
 */
class TaggerCore {
  constructor(config, database, aiConfig) {
    this.config = config;
    this.database = database;
    this.aiConfig = aiConfig;
  }

  /**
   * 获取待处理文档列表
   */
  async getPendingDocs(scanner, processAll = false) {
    const cfg = this.config.load();
    const docs = await scanner.scanFolder(cfg.targetFolder);
    
    if (processAll) {
      return { docs, total: docs.length, skipped: 0 };
    }
    
    // 筛选未打标的文档
    const pendingDocs = docs.filter(doc => {
      const mtime = Math.floor(doc.mtime / 1000);
      return !this.database.isDocTagged(doc.relativePath, mtime);
    });
    
    return {
      docs: pendingDocs,
      total: docs.length,
      skipped: docs.length - pendingDocs.length
    };
  }

  /**
   * 创建标签生成器
   */
  createTagGenerator(options = {}) {
    if (!this.aiConfig.hasAIConfig()) {
      return null;
    }
    
    try {
      return this.aiConfig.createTagGenerator(options);
    } catch (error) {
      return null;
    }
  }

  /**
   * 为单个文档生成标签
   */
  async generateTagsForDoc(tagGenerator, doc, scanner, existingTags) {
    const content = scanner.readDoc(doc.fullPath);
    const docExistingTags = scanner.extractExistingTags(content);
    
    if (!tagGenerator) {
      return {
        success: false,
        content,
        docExistingTags,
        error: 'No AI configured'
      };
    }
    
    try {
      const result = await tagGenerator.generate(
        { path: doc.relativePath, content },
        { existingTags, docTags: docExistingTags }
      );
      
      return {
        success: true,
        content,
        docExistingTags,
        result
      };
    } catch (error) {
      return {
        success: false,
        content,
        docExistingTags,
        error: error.message
      };
    }
  }

  /**
   * 写入标签到文档
   */
  async writeTagsToDoc(scanner, doc, tags, position) {
    const content = scanner.readDoc(doc.fullPath);
    const newContent = scanner.addTagsToDoc(content, tags, position);
    scanner.writeDoc(doc.fullPath, newContent);
    
    // 更新数据库
    const mtime = Math.floor(fs.statSync(doc.fullPath).mtimeMs / 1000);
    for (const tag of tags) {
      this.database.addTag(tag, doc.relativePath, mtime);
    }
    this.database.save();
    
    return { success: true, tags };
  }

  /**
   * 获取所有标签列表
   */
  getAllTags() {
    return this.database.getAllTags().map(tag => ({
      tag,
      docCount: this.database.getTagDocs(tag).length
    }));
  }

  /**
   * 获取标签关联的文档
   */
  getTagDocs(tag) {
    return this.database.getTagDocs(tag);
  }

  /**
   * 重命名标签
   */
  async renameTag(scanner, oldTag, newTag) {
    const cfg = this.config.load();
    const docs = this.database.getTagDocs(oldTag);
    
    for (const docInfo of docs) {
      const fullPath = path.join(cfg.vaultPath, docInfo.path);
      const content = scanner.readDoc(fullPath);
      const newContent = scanner.renameTagInDoc(content, oldTag, newTag);
      scanner.writeDoc(fullPath, newContent);
    }
    
    // 更新数据库
    this.database.data.tags[newTag] = this.database.data.tags[oldTag];
    delete this.database.data.tags[oldTag];
    this.database.save();
    
    return { success: true, oldTag, newTag, docCount: docs.length };
  }

  /**
   * 删除标签
   */
  async deleteTag(scanner, tag) {
    const cfg = this.config.load();
    const docs = this.database.getTagDocs(tag);
    
    for (const docInfo of docs) {
      const fullPath = path.join(cfg.vaultPath, docInfo.path);
      const content = scanner.readDoc(fullPath);
      const newContent = scanner.removeTagFromDoc(content, tag);
      scanner.writeDoc(fullPath, newContent);
    }
    
    this.database.removeTag(tag);
    this.database.save();
    
    return { success: true, tag, docCount: docs.length };
  }
}

module.exports = TaggerCore;
