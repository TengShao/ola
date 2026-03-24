const BaseAdapter = require('./base');
const CLIAdapter = require('./cli');
const OpenClawAdapter = require('./openclaw');

/**
 * 适配器工厂
 * 根据环境创建对应的适配器
 */
class AdapterFactory {
  static create(options = {}) {
    // 检测是否在 OpenClaw 环境
    const isOpenClaw = !!process.env.OPENCLAW_SESSION || 
                       !!process.env.OPENCLAW_GATEWAY;
    
    if (isOpenClaw) {
      return new OpenClawAdapter(options.messageTool);
    } else {
      return new CLIAdapter();
    }
  }
}

module.exports = {
  BaseAdapter,
  CLIAdapter,
  OpenClawAdapter,
  AdapterFactory
};
