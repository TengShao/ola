/**
 * OpenClaw 完整交互处理器
 * 按 PRD 规范实现多轮对话
 */
const fs = require('fs');
const path = require('path');
const { Config, Database } = require('../config');
const Scanner = require('../scanner');
const AIConfig = require('../ai/config');
const { TagGenerator } = require('../core');
const OpenClawStateManager = require('./state-manager');
const OpenClawFormatter = require('./formatter');

class OpenClawHandler {
  constructor() {
    this.config = new Config();
    this.database = new Database();
    this.aiConfig = new AIConfig(this.config);
    this.stateManager = new OpenClawStateManager();
  }

  /**
   * 处理新标签流程（完整交互版）
   */
  async handleNewLabels(sessionId, userInput = null) {
    const state = this.stateManager.getState(sessionId);
    
    // 新会话
    if (!state) {
      return this.startNewLabels(sessionId);
    }
    
    // 根据当前步骤处理用户输入
    switch (state.step) {
      case 'confirm_tags':
        return this.handleTagConfirmation(sessionId, userInput, state);
      case 'select_partial':
        return this.handlePartialSelection(sessionId, userInput, state);
      case 'input_manual':
        return this.handleManualInput(sessionId, userInput, state);
      default:
        return { type: 'error', message: '未知状态' };
    }
  }

  /**
   * 开始新标签流程
   */
  async startNewLabels(sessionId) {
    const cfg = this.config.load();
    if (!cfg) {
      return {
        type: 'error',
        message: '⚠️ 首次使用，请先配置\n运行: /ola config'
      };
    }

    const scanner = new Scanner(cfg.vaultPath);
    const docs = await scanner.scanFolder(cfg.targetFolder);
    
    // 筛选未打标的文档
    const pendingDocs = docs.filter(doc => {
      const mtime = Math.floor(doc.mtime / 1000);
      return !this.database.isDocTagged(doc.relativePath, mtime);
    });
    
    if (pendingDocs.length === 0) {
      return {
        type: 'complete',
        message: '✅ 所有文档都已打标！'
      };
    }

    // 创建状态
    const state = this.stateManager.createState(sessionId, {
      cfg,
      scanner,
      docs: pendingDocs,
      currentIndex: 0,
      results: [],
      existingTags: this.database.getAllTags()
    });

    // 检查 AI 配置
    let tagGenerator = null;
    if (this.aiConfig.hasAIConfig()) {
      try {
        tagGenerator = this.aiConfig.createTagGenerator({ maxTags: 5 });
      } catch (e) {
        // AI 配置错误，使用手动模式
      }
    }
    state.data.tagGenerator = tagGenerator;

    // 处理第一个文档
    return this.processNextDoc(sessionId, state);
  }

  /**
   * 处理下一个文档
   */
  async processNextDoc(sessionId, state) {
    const { docs, currentIndex, tagGenerator, existingTags, scanner } = state.data;
    
    if (currentIndex >= docs.length) {
      // 所有文档处理完成
      return this.completeSession(sessionId, state);
    }

    const doc = docs[currentIndex];
    const content = scanner.readDoc(doc.fullPath);
    const docExistingTags = scanner.extractExistingTags(content);
    
    // 保存当前文档信息
    state.data.currentDoc = {
      ...doc,
      content,
      existingTags: docExistingTags,
      name: path.basename(doc.relativePath, '.md')
    };

    // AI 生成标签
    if (tagGenerator) {
      try {
        const result = await tagGenerator.generate(
          { path: doc.relativePath, content },
          { existingTags, docTags: docExistingTags }
        );
        
        state.data.currentResult = result;
        state.step = 'confirm_tags';
        
        // 返回确认消息
        return {
          type: 'confirm',
          message: OpenClawFormatter.formatTagConfirmation(
            state.data.currentDoc,
            result.tags,
            docExistingTags.length > 0
          ) + '\n\n' + OpenClawFormatter.formatTagSelection()
        };
        
      } catch (error) {
        // AI 失败，切换到手动模式
        state.data.tagGenerator = null;
      }
    }

    // 手动输入模式
    state.step = 'input_manual';
    return {
      type: 'input',
      message: OpenClawFormatter.formatManualInput(docExistingTags.length > 0)
        .replace('{{docName}}', state.data.currentDoc.name)
        .replace('{{existingTags}}', docExistingTags.join(' ') || '无')
        .replace('{{docPath}}', doc.relativePath)
    };
  }

  /**
   * 处理标签确认
   */
  handleTagConfirmation(sessionId, userInput, state) {
    const input = userInput?.trim();
    
    if (input === '0' || input === '跳过') {
      // 跳过当前文档，处理下一个
      state.data.currentIndex++;
      state.step = 'idle';
      return this.processNextDoc(sessionId, state);
    }
    
    if (input === '1' || input === '确认' || input === '全部添加') {
      // 全部添加
      const tags = state.data.currentResult.tags.map(t => t.tag);
      return this.writeTagsAndContinue(sessionId, state, tags);
    }
    
    if (input === '2' || input === '部分添加') {
      // 进入部分选择
      state.step = 'select_partial';
      return {
        type: 'select',
        message: OpenClawFormatter.formatPartialSelection(state.data.currentResult.tags)
      };
    }
    
    if (input === '3' || input === '手动输入') {
      // 进入手动输入
      state.step = 'input_manual';
      const doc = state.data.currentDoc;
      return {
        type: 'input',
        message: OpenClawFormatter.formatManualInput(doc.existingTags.length > 0)
          .replace('{{docName}}', doc.name)
          .replace('{{existingTags}}', doc.existingTags.join(' ') || '无')
          .replace('{{docPath}}', doc.relativePath)
      };
    }
    
    // 无效输入，重新提示
    return {
      type: 'confirm',
      message: '❓ 无效回复\n\n' + 
        OpenClawFormatter.formatTagConfirmation(
          state.data.currentDoc,
          state.data.currentResult.tags,
          state.data.currentDoc.existingTags.length > 0
        ) + '\n\n' + OpenClawFormatter.formatTagSelection()
    };
  }

  /**
   * 处理部分选择
   */
  handlePartialSelection(sessionId, userInput, state) {
    const input = userInput?.trim();
    
    if (input === '0' || input === '返回') {
      // 返回确认界面
      state.step = 'confirm_tags';
      return {
        type: 'confirm',
        message: OpenClawFormatter.formatTagConfirmation(
          state.data.currentDoc,
          state.data.currentResult.tags,
          state.data.currentDoc.existingTags.length > 0
        ) + '\n\n' + OpenClawFormatter.formatTagSelection()
      };
    }
    
    // 解析编号
    const indices = input.split(/\s+/).map(n => parseInt(n) - 1).filter(n => !isNaN(n));
    const tags = indices
      .map(i => state.data.currentResult.tags[i])
      .filter(Boolean)
      .map(t => t.tag);
    
    if (tags.length === 0) {
      return {
        type: 'select',
        message: '❓ 无效选择，请回复编号\n\n' +
          OpenClawFormatter.formatPartialSelection(state.data.currentResult.tags)
      };
    }
    
    return this.writeTagsAndContinue(sessionId, state, tags);
  }

  /**
   * 处理手动输入
   */
  handleManualInput(sessionId, userInput, state) {
    const input = userInput?.trim();
    
    if (input === '0' || input === '返回') {
      // 如果有 AI 结果，返回确认界面
      if (state.data.currentResult) {
        state.step = 'confirm_tags';
        return {
          type: 'confirm',
          message: OpenClawFormatter.formatTagConfirmation(
            state.data.currentDoc,
            state.data.currentResult.tags,
            state.data.currentDoc.existingTags.length > 0
          ) + '\n\n' + OpenClawFormatter.formatTagSelection()
        };
      }
      
      // 否则跳过
      state.data.currentIndex++;
      state.step = 'idle';
      return this.processNextDoc(sessionId, state);
    }
    
    // 解析标签
    const tags = input.split(/\s+/)
      .map(t => t.trim())
      .filter(t => t)
      .map(t => t.startsWith('#') ? t : '#' + t);
    
    if (tags.length === 0) {
      const doc = state.data.currentDoc;
      return {
        type: 'input',
        message: '❓ 无效输入\n\n' +
          OpenClawFormatter.formatManualInput(doc.existingTags.length > 0)
            .replace('{{docName}}', doc.name)
            .replace('{{existingTags}}', doc.existingTags.join(' ') || '无')
            .replace('{{docPath}}', doc.relativePath)
      };
    }
    
    return this.writeTagsAndContinue(sessionId, state, tags);
  }

  /**
   * 写入标签并继续
   */
  async writeTagsAndContinue(sessionId, state, tags) {
    const { scanner, cfg } = state.data;
    const doc = state.data.currentDoc;
    
    // 写入文档
    const newContent = scanner.addTagsToDoc(doc.content, tags, cfg.labelPosition);
    scanner.writeDoc(doc.fullPath, newContent);
    
    // 更新数据库
    const mtime = Math.floor(fs.statSync(doc.fullPath).mtimeMs / 1000);
    for (const tag of tags) {
      this.database.addTag(tag, doc.relativePath, mtime);
    }
    this.database.save();
    
    // 记录结果
    state.data.results.push({
      name: doc.name,
      path: doc.relativePath,
      tags: tags.map(t => ({ tag: t }))
    });
    
    // 处理下一个
    state.data.currentIndex++;
    state.step = 'idle';
    
    return this.processNextDoc(sessionId, state);
  }

  /**
   * 完成会话
   */
  completeSession(sessionId, state) {
    const results = state.data.results;
    this.stateManager.deleteState(sessionId);
    
    return {
      type: 'complete',
      message: OpenClawFormatter.formatFinalSummary(results)
    };
  }

  /**
   * 处理标签列表
   */
  async handleListTags() {
    const tags = this.database.getAllTags().map(tag => ({
      tag,
      docCount: this.database.getTagDocs(tag).length
    }));
    
    if (tags.length === 0) {
      return {
        type: 'complete',
        message: '📭 标签数据库为空'
      };
    }
    
    return {
      type: 'list',
      message: OpenClawFormatter.formatTagList(tags)
    };
  }
}

module.exports = OpenClawHandler;
