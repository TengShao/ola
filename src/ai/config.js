// AI 配置管理
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');
const { PROVIDER_CONFIGS, PROVIDER_LIST } = require('./providers');

class AIConfig {
  constructor(configInstance) {
    this.config = configInstance;
  }

  // 检查是否有完整的 AI 配置
  hasAIConfig() {
    const cfg = this.config.load();
    return !!(cfg.ai && cfg.ai.provider && cfg.ai.model && cfg.ai.apiKey);
  }

  // 获取当前配置字符串（用于显示）
  getCurrentConfigString() {
    const cfg = this.config.load();
    if (!cfg.ai) return null;
    return `${cfg.ai.provider}/${cfg.ai.model}`;
  }

  // 获取当前配置详情
  getCurrentConfig() {
    const cfg = this.config.load();
    return cfg.ai || null;
  }

  // 保存 AI 配置
  saveAIConfig(provider, model, apiKey, extra = {}) {
    const cfg = this.config.load();
    const providerConfig = PROVIDER_CONFIGS[provider];
    
    cfg.ai = {
      provider,
      model,
      apiKey, // TODO: 加密存储
      baseUrl: providerConfig.defaultBaseUrl,
      ...extra
    };
    
    this.config.save(cfg);
  }

  // 交互式配置流程
  async configureAI() {
    const hasConfig = this.hasAIConfig();
    
    if (hasConfig) {
      // 已有配置，询问是否更改
      const current = this.getCurrentConfigString();
      console.log(chalk.blue(`\n模型当前配置: ${current}`));
      
      const { shouldChange } = await inquirer.prompt([{
        type: 'list',
        name: 'shouldChange',
        message: '是否更改？',
        choices: [
          { name: '1. 是', value: true },
          { name: '2. 返回', value: false }
        ]
      }]);
      
      if (!shouldChange) {
        return;
      }
    } else {
      // 无配置，询问是否配置
      console.log(chalk.yellow('\n未检测到用于智能生成标签的模型配置'));
      console.log(chalk.gray('Tips: 不配置模型，只支持手动添加标签哦\n'));
      
      const { shouldConfig } = await inquirer.prompt([{
        type: 'list',
        name: 'shouldConfig',
        message: '现在配置吗？',
        choices: [
          { name: '1. 是', value: true },
          { name: '2. 返回', value: false }
        ]
      }]);
      
      if (!shouldConfig) {
        return;
      }
    }

    // 选择供应商
    const { provider } = await this.promptForProvider();
    if (provider === 'back') {
      return;
    }

    // 输入 API Key
    const { apiKey } = await this.promptForApiKey(provider);
    if (apiKey === 'back') {
      return;
    }

    // 选择模型
    const { model } = await this.promptForModel(provider);
    if (model === 'back') {
      return;
    }

    // 保存配置
    this.saveAIConfig(provider, model, apiKey);
    console.log(chalk.green('\n✅ 模型配置已保存'));
  }

  // 选择供应商
  async promptForProvider() {
    const choices = [
      ...PROVIDER_LIST.map((p, i) => ({
        name: `${i + 1}. ${p.name}`,
        value: p.key
      })),
      { name: 'x. 返回', value: 'back' }
    ];

    const { provider } = await inquirer.prompt([{
      type: 'list',
      name: 'provider',
      message: '请选择你的模型供应商：',
      choices
    }]);

    return { provider };
  }

  // 输入 API Key
  async promptForApiKey(provider) {
    const providerConfig = PROVIDER_CONFIGS[provider];
    
    // Ollama 本地运行，不需要 API Key
    if (providerConfig.isLocal) {
      return { apiKey: '' };
    }

    const { apiKey } = await inquirer.prompt([{
      type: 'password',
      name: 'apiKey',
      message: '请输入你的 API Key：',
      mask: '*',
      validate: (input) => {
        if (!input.trim()) {
          return 'API Key 不能为空';
        }
        return true;
      }
    }]);

    return { apiKey };
  }

  // 选择模型
  async promptForModel(provider) {
    const providerConfig = PROVIDER_CONFIGS[provider];
    
    const choices = [
      ...providerConfig.models.map((m, i) => ({
        name: `${i + 1}. ${m.id} (${m.name})`,
        value: m.id
      })),
      { name: 'x. 返回', value: 'back' }
    ];

    const { model } = await inquirer.prompt([{
      type: 'list',
      name: 'model',
      message: '请选择模型：',
      choices
    }]);

    return { model };
  }

  // 清除 AI 配置
  clearAIConfig() {
    const cfg = this.config.load();
    delete cfg.ai;
    this.config.save(cfg);
  }
}

module.exports = AIConfig;
