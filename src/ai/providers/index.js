const AliyunProvider = require('./aliyun');
const BailianProvider = require('./bailian');
const SiliconFlowProvider = require('./siliconflow');

/**
 * AI 提供商工厂
 * 根据配置创建对应的提供商实例
 */
class ProviderFactory {
  static create(config) {
    const { provider, ...providerConfig } = config;

    switch (provider) {
      case 'aliyun':
        return new AliyunProvider(providerConfig);
      case 'bailian':
        return new BailianProvider(providerConfig);
      case 'siliconflow':
        return new SiliconFlowProvider(providerConfig);
      // TODO: 添加其他提供商
      // case 'openai':
      //   return new OpenAIProvider(providerConfig);
      // case 'kimi':
      //   return new KimiProvider(providerConfig);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }
}

module.exports = ProviderFactory;
