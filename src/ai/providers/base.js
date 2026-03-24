// AI Provider 基类
class BaseAIProvider {
  constructor(config) {
    this.config = config;
  }

  /**
   * 生成标签
   * @param {Object} document - 文档对象 { path, content }
   * @param {Array} existingTags - 已有标签列表
   * @returns {Promise<Object>} - { candidates: [], summary: '' }
   */
  async generateTags(document, existingTags = []) {
    throw new Error('Not implemented');
  }

  /**
   * 构建请求体
   * @param {Object} document
   * @param {Array} existingTags
   * @returns {Object}
   */
  buildRequestBody(document, existingTags) {
    throw new Error('Not implemented');
  }

  /**
   * 解析响应
   * @param {Object} response
   * @returns {Object}
   */
  parseResponse(response) {
    throw new Error('Not implemented');
  }
}

module.exports = BaseAIProvider;
