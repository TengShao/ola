/**
 * OpenClaw 消息格式化工具
 * 按 PRD 规范生成消息格式
 */
class OpenClawFormatter {
  /**
   * 标签确认消息（PRD 规范）
   */
  static formatTagConfirmation(doc, tags, hasExisting = false) {
    const existingTags = doc.existingTags || [];
    
    // 标记新增标签
    const tagStrings = tags.map(t => {
      const isNew = t.status === 'new';
      return isNew ? `${t.tag}(新增)` : t.tag;
    });
    
    let message = '这个文档将写入标签，回复"确认"或"跳过"\n\n';
    
    if (hasExisting && existingTags.length > 0) {
      // 有已有标签的表格
      message += '| 文档名称 | 原有标签 | 添加标签 |\n';
      message += '| ---- | ---- | ---- |\n';
      message += `| ${doc.name} | ${existingTags.join(' ')} | ${tagStrings.join(' ')} |\n`;
    } else {
      // 无已有标签的表格
      message += '| 文档名称 | 添加标签 |\n';
      message += '| ---- | ---- |\n';
      message += `| ${doc.name} | ${tagStrings.join(' ')} |\n`;
    }
    
    return message;
  }

  /**
   * 标签添加选择（PRD 规范）
   */
  static formatTagSelection() {
    return '回复"1"全部添加，回复"2"部分添加，回复"0"跳过';
  }

  /**
   * 部分添加 - 标签列表（PRD 规范）
   */
  static formatPartialSelection(tags) {
    let message = '回复要添加的标签的编号，如有多个，编号用空格分隔，回复"0"返回\n\n';
    message += '| 编号 | 标签名称 |\n';
    message += '| ---- | ---- |\n';
    
    tags.forEach((t, i) => {
      const status = t.status === 'new' ? ' (新增)' : '';
      message += `| ${i + 1} | ${t.tag}${status} |\n`;
    });
    
    return message;
  }

  /**
   * 手动输入提示（PRD 规范）
   */
  static formatManualInput(hasExisting = false) {
    let message = '';
    
    if (hasExisting) {
      message += '| 文档名称 | 原有标签 | 文档路径 |\n';
      message += '| ---- | ---- | ---- |\n';
      message += '| {{docName}} | {{existingTags}} | {{docPath}} |\n\n';
    } else {
      message += '| 文档名称 | 文档路径 |\n';
      message += '| ---- | ---- |\n';
      message += '| {{docName}} | {{docPath}} |\n\n';
    }
    
    message += '请回复要添加的标签名称（记得带#号哦）（带不带都行:-p）（"0"除外）\n';
    message += '回复"0"返回';
    
    return message;
  }

  /**
   * 最终结果汇总（PRD 规范）
   */
  static formatFinalSummary(results) {
    let message = `打标已全部完成，本次处理${results.length}个文档，结果如下：\n\n`;
    message += '| 编号 | 文档名称 | 标签 |\n';
    message += '| --- | ---- | ---- |\n';
    
    results.forEach((r, i) => {
      const tags = r.tags.map(t => t.tag).join(' ');
      message += `| ${i + 1} | ${r.name} | ${tags} |\n`;
    });
    
    return message;
  }

  /**
   * 标签列表（PRD 规范）
   */
  static formatTagList(tags) {
    let message = '以下为所有标签，回复编号查看对应文档，回复"R"倒序排序，回复"0"返回上一级\n\n';
    message += '| 编号 | 标签 | 关联文档数量 |\n';
    message += '| ---- | ---- | ---- |\n';
    
    tags.forEach((t, i) => {
      message += `| ${i + 1} | ${t.tag} | ${t.docCount} |\n`;
    });
    
    return message;
  }

  /**
   * 文档列表（PRD 规范）
   */
  static formatDocList(docs) {
    let message = '以下为关联的文档，回复编号查看文档内容。回复"R"倒序排序，回复"0"返回上一级\n\n';
    message += '| 编号 | 标题 | 文件路径 | 上次修改 |\n';
    message += '| ---- | ---- | ---- | ---- |\n';
    
    docs.forEach((d, i) => {
      const date = new Date(d.mtime).toLocaleDateString();
      message += `| ${i + 1} | ${d.name} | ${d.path} | ${date} |\n`;
    });
    
    return message;
  }

  /**
   * 修改/删除选择（PRD 规范）
   */
  static formatTagAction(tag, docCount) {
    return `标签 \`${tag}\`(关联${docCount}个文档)：回复"1"修改，"2"删除，"0"返回`;
  }

  /**
   * 修改输入提示（PRD 规范）
   */
  static formatRenameInput() {
    return '请回复新的标签名称（记得带#号哦）（带不带都行:-p）（"0"除外）\n回复"0"返回';
  }

  /**
   * 修改成功（PRD 规范）
   */
  static formatRenameSuccess(newTag, docCount) {
    return `修改成功！新标签名称 \`${newTag}\`(关联${docCount}个文档)\n回复"1"再次修改，回复"0"返回`;
  }

  /**
   * 未修改（PRD 规范）
   */
  static formatRenameUnchanged(tag, docCount) {
    return `未修改。标签名称 \`${tag}\`(关联${docCount}个文档)\n回复"1"再次修改，回复"0"返回`;
  }
}

module.exports = OpenClawFormatter;
