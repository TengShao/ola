const BaseAdapter = require('./base');

/**
 * OpenClaw 交互适配器
 * 使用消息方式进行交互
 */
class OpenClawAdapter extends BaseAdapter {
  constructor(messageTool) {
    super();
    this.message = messageTool;
    this.messageId = null;
  }

  async show(text, type = 'info') {
    // OpenClaw 中直接返回消息即可
    // 实际发送由调用方处理
    return { type, text };
  }

  async select(message, choices) {
    // 构建选项表格
    let optionsText = '';
    
    // 检查是否有复杂选项（需要表格展示）
    const hasComplexData = choices.some(c => c.docCount || c.path);
    
    if (hasComplexData) {
      // 使用 Markdown 表格
      optionsText = '| 编号 | 选项 |\n| ---- | ---- |\n';
      choices.forEach((c, i) => {
        const extra = c.docCount ? ` (${c.docCount} 个文档)` : '';
        optionsText += `| ${i + 1} | ${c.name}${extra} |\n`;
      });
    } else {
      // 简单列表
      choices.forEach((c, i) => {
        optionsText += `${i + 1}. ${c.name}\n`;
      });
    }
    
    const fullMessage = `${message}\n\n${optionsText}\n回复编号选择，回复"0"返回`;
    
    // 在实际实现中，这里需要：
    // 1. 发送消息
    // 2. 等待用户回复
    // 3. 解析回复的编号
    // 4. 返回对应的 value
    
    // 暂时返回消息结构，实际交互由上层处理
    return {
      type: 'select',
      message: fullMessage,
      choices: choices.map((c, i) => ({ ...c, index: i + 1 }))
    };
  }

  async multiSelect(message, choices) {
    // 构建多选表格
    let optionsText = '| 编号 | 选项 |\n| ---- | ---- |\n';
    choices.forEach((c, i) => {
      const checked = c.checked ? '✓ ' : '';
      optionsText += `| ${i + 1} | ${checked}${c.name} |\n`;
    });
    
    const fullMessage = `${message}\n\n${optionsText}\n回复要选择的编号，多个编号用空格分隔，回复"0"返回`;
    
    return {
      type: 'multiSelect',
      message: fullMessage,
      choices: choices.map((c, i) => ({ ...c, index: i + 1 }))
    };
  }

  async input(message, options = {}) {
    const hint = options.hint || '（直接回复消息）';
    const fullMessage = `${message}\n${hint}${options.allowEmpty ? '' : '，回复"0"返回'}`;
    
    return {
      type: 'input',
      message: fullMessage,
      validate: options.validate
    };
  }

  async confirm(message, defaultValue = false) {
    const defaultText = defaultValue ? '回复"1"确认，回复"0"取消' : '回复"1"确认，回复"0"取消';
    const fullMessage = `${message}\n${defaultText}`;
    
    return {
      type: 'confirm',
      message: fullMessage,
      defaultValue
    };
  }

  async showTagSuggestions(doc, result) {
    // 构建标签建议表格
    let table = '| 标签 | 状态 | 相关度 |\n| ---- | ---- | ---- |\n';
    
    result.tags.forEach((t, i) => {
      const status = t.status === 'new' ? '新增' : t.status === 'similar' ? '相似' : '已有';
      table += `| ${t.tag} | ${status} | ${(t.relevance * 100).toFixed(0)}% |\n`;
    });
    
    const message = `📄 **${doc.path}**\n\n` +
      (doc.existingTags?.length > 0 ? `已有标签: ${doc.existingTags.join(' ')}\n\n` : '') +
      `💡 AI 建议标签:\n\n${table}\n` +
      (result.summary ? `📋 ${result.summary}\n\n` : '') +
      `回复"1"全部添加，回复"2"部分添加，回复"3"手动输入，回复"0"跳过`;
    
    return {
      type: 'tagSuggestions',
      message,
      doc,
      result
    };
  }

  async showDocList(docs) {
    let table = '| 编号 | 文档路径 | 标签 |\n| ---- | ---- | ---- |\n';
    
    docs.forEach((doc, i) => {
      const tags = doc.existingTags?.length > 0 
        ? doc.existingTags.join(' ')
        : '无';
      table += `| ${i + 1} | ${doc.path} | ${tags} |\n`;
    });
    
    const message = `📄 发现 ${docs.length} 个文档:\n\n${table}\n回复编号查看详情，回复"0"返回`;
    
    return {
      type: 'docList',
      message,
      docs
    };
  }

  async showTagList(tags) {
    let table = '| 编号 | 标签 | 关联文档 |\n| ---- | ---- | ---- |\n';
    
    tags.forEach((t, i) => {
      table += `| ${i + 1} | ${t.tag} | ${t.docCount} 个 |\n`;
    });
    
    const message = `🏷️ 标签列表:\n\n${table}\n回复编号查看关联文档，回复"R"倒序，回复"0"返回`;
    
    return {
      type: 'tagList',
      message,
      tags
    };
  }

  /**
   * 显示最终结果汇总
   */
  async showFinalSummary(results) {
    let table = '| 编号 | 文档 | 标签 |\n| ---- | ---- | ---- |\n';
    
    results.forEach((r, i) => {
      if (r.success) {
        const tags = r.tags.map(t => t.tag).join(' ');
        table += `| ${i + 1} | ${r.path} | ${tags} |\n`;
      } else {
        table += `| ${i + 1} | ${r.path} | ❌ ${r.error} |\n`;
      }
    });
    
    const message = `🎉 处理完成！共 ${results.length} 个文档\n\n${table}`;
    
    return {
      type: 'finalSummary',
      message,
      results
    };
  }
}

module.exports = OpenClawAdapter;
