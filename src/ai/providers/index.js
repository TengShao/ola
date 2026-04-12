const AliyunProvider = require('./aliyun');
const BailianProvider = require('./bailian');
const SiliconFlowProvider = require('./siliconflow');
const GenericProvider = require('./generic');

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
      // 其他 provider 都用通用实现（支持自定义 baseURL + model）
      default:
        return new GenericProvider(providerConfig);
    }
  }
}

module.exports = ProviderFactory;
