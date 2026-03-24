const ProviderFactory = require('../ai/providers/index');
const TagMatcher = require('./tag-matcher');

/**
 * 标签生成器
 * 整合 AI 生成和标签匹配的核心逻辑
 */
class TagGenerator {
  constructor(aiConfig, options = {}) {
    this.provider = ProviderFactory.create(aiConfig);
    this.matcher = new TagMatcher(options);
    this.maxTags = options.maxTags || 5;
  }

  /**
   * 为文档生成标签
   * @param {Object} document - { path, content }
   * @param {Object} context - 上下文信息
   * @param {Array} context.existingTags - 数据库中所有标签
   * @param {Array} context.docTags - 文档中已有标签
   * @returns {Promise<Object>} - { summary, tags, candidates }
   */
  async generate(document, context = {}) {
    const { existingTags = [], docTags = [] } = context;
    
    // 1. 调用 AI 生成候选标签
    const aiResult = await this.provider.generateTags(document, docTags);
    
    // 2. 与已有标签匹配
    const matchedTags = this.matcher.match(
      aiResult.candidates,
      existingTags,
      docTags
    );
    
    // 3. 合并并限制数量
    const finalTags = this.matcher.mergeTags(
      matchedTags,
      docTags,
      this.maxTags
    );
    
    return {
      summary: aiResult.summary,
      tags: finalTags,
      candidates: matchedTags,
      stats: {
        total: finalTags.length,
        existing: finalTags.filter(t => t.status === 'existing').length,
        similar: finalTags.filter(t => t.status === 'similar').length,
        new: finalTags.filter(t => t.status === 'new').length
      }
    };
  }

  /**
   * 批量生成标签
   * @param {Array} documents - [{ path, content }, ...]
   * @param {Object} context
   * @returns {Promise<Array>}
   */
  async generateBatch(documents, context = {}) {
    const results = [];
    
    for (const doc of documents) {
      try {
        const result = await this.generate(doc, context);
        results.push({
          path: doc.path,
          success: true,
          ...result
        });
      } catch (error) {
        results.push({
          path: doc.path,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }
}

module.exports = TagGenerator;
