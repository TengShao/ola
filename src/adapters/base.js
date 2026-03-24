/**
 * 交互适配器基类
 * 定义统一的交互接口，CLI 和 OpenClaw 分别实现
 */
class BaseAdapter {
  /**
   * 显示消息
   * @param {string} message 
   * @param {string} type - 'info' | 'success' | 'warning' | 'error'
   */
  async show(message, type = 'info') {
    throw new Error('Not implemented');
  }

  /**
   * 列表选择
   * @param {string} message 
   * @param {Array} choices - [{ name, value }, ...]
   * @returns {Promise<string>} - 选中的 value
   */
  async select(message, choices) {
    throw new Error('Not implemented');
  }

  /**
   * 多选
   * @param {string} message 
   * @param {Array} choices - [{ name, value, checked }, ...]
   * @returns {Promise<Array>} - 选中的 values
   */
  async multiSelect(message, choices) {
    throw new Error('Not implemented');
  }

  /**
   * 文本输入
   * @param {string} message 
   * @param {Object} options - { default, validate }
   * @returns {Promise<string>}
   */
  async input(message, options = {}) {
    throw new Error('Not implemented');
  }

  /**
   * 确认
   * @param {string} message 
   * @param {boolean} defaultValue 
   * @returns {Promise<boolean>}
   */
  async confirm(message, defaultValue = false) {
    throw new Error('Not implemented');
  }

  /**
   * 显示标签建议
   * @param {Object} doc - { path, existingTags }
   * @param {Object} result - { summary, tags, candidates }
   */
  async showTagSuggestions(doc, result) {
    throw new Error('Not implemented');
  }

  /**
   * 显示文档列表
   * @param {Array} docs - [{ path, existingTags }, ...]
   */
  async showDocList(docs) {
    throw new Error('Not implemented');
  }

  /**
   * 显示标签列表
   * @param {Array} tags - [{ tag, docCount }, ...]
   */
  async showTagList(tags) {
    throw new Error('Not implemented');
  }
}

module.exports = BaseAdapter;
