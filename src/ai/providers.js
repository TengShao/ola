// AI 供应商配置
// 官方文档地址和默认配置参数

const PROVIDER_CONFIGS = {
  openai: {
    name: 'OpenAI',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4',
    envKey: 'OPENAI_API_KEY',
    docs: 'https://platform.openai.com/docs',
    models: [
      { id: 'gpt-4', name: 'GPT-4' },
      { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
    ]
  },
  
  anthropic: {
    name: 'Anthropic',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-opus-20240229',
    envKey: 'ANTHROPIC_API_KEY',
    docs: 'https://docs.anthropic.com',
    models: [
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' }
    ]
  },
  
  google: {
    name: 'Google',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-pro',
    envKey: 'GOOGLE_API_KEY',
    docs: 'https://ai.google.dev/docs',
    models: [
      { id: 'gemini-pro', name: 'Gemini Pro' },
      { id: 'gemini-pro-vision', name: 'Gemini Pro Vision' }
    ]
  },
  
  openrouter: {
    name: 'OpenRouter',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'openai/gpt-4',
    envKey: 'OPENROUTER_API_KEY',
    docs: 'https://openrouter.ai/docs',
    models: [
      { id: 'openai/gpt-4', name: 'GPT-4 (via OpenRouter)' },
      { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus (via OpenRouter)' },
      { id: 'google/gemini-pro', name: 'Gemini Pro (via OpenRouter)' }
    ],
    extraHeaders: {
      'HTTP-Referer': 'https://github.com/TengShao/ola',
      'X-Title': 'Ola - Obsidian Tagger'
    }
  },
  
  kimi: {
    name: 'Kimi',
    defaultBaseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
    envKey: 'MOONSHOT_API_KEY',
    docs: 'https://platform.moonshot.cn/docs',
    models: [
      { id: 'moonshot-v1-8k', name: 'Moonshot v1 8K' },
      { id: 'moonshot-v1-32k', name: 'Moonshot v1 32K' },
      { id: 'moonshot-v1-128k', name: 'Moonshot v1 128K' }
    ]
  },
  
  minimax: {
    name: 'MiniMax',
    defaultBaseUrl: 'https://api.minimax.chat/v1',
    defaultModel: 'abab6.5-chat',
    envKey: 'MINIMAX_API_KEY',
    docs: 'https://www.minimaxi.com/document',
    models: [
      { id: 'abab6.5-chat', name: 'abab6.5 Chat' },
      { id: 'abab6-chat', name: 'abab6 Chat' }
    ],
    extraParams: ['group_id']
  },
  
  zai: {
    name: 'Z.ai',
    defaultBaseUrl: 'https://api.z.ai/v1',
    defaultModel: 'glm-4',
    envKey: 'ZAI_API_KEY',
    docs: 'https://www.z.ai/docs',
    models: [
      { id: 'glm-4', name: 'GLM-4' },
      { id: 'glm-3-turbo', name: 'GLM-3 Turbo' }
    ]
  },
  
  bailian: {
    name: '阿里云百炼',
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus',
    envKey: 'DASHSCOPE_API_KEY',
    docs: 'https://help.aliyun.com/document_detail/611472.html',
    models: [
      { id: 'qwen-turbo', name: '通义千问 Turbo' },
      { id: 'qwen-plus', name: '通义千问 Plus' },
      { id: 'qwen-max', name: '通义千问 Max' },
      { id: 'qwen-coder-plus', name: '通义千问 Coder Plus' }
    ]
  },

  siliconflow: {
    name: 'SiliconFlow',
    defaultBaseUrl: 'https://api.siliconflow.cn/v1',
    defaultModel: 'Qwen/Qwen2.5-7B-Instruct',
    envKey: 'SILICONFLOW_API_KEY',
    docs: 'https://docs.siliconflow.cn',
    models: [
      { id: 'Qwen/Qwen2.5-7B-Instruct', name: '通义千问 2.5 7B' },
      { id: 'Qwen/Qwen2.5-32B-Instruct', name: '通义千问 2.5 32B' },
      { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3' },
      { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1' }
    ]
  },
  
  deepseek: {
    name: 'DeepSeek',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    envKey: 'DEEPSEEK_API_KEY',
    docs: 'https://platform.deepseek.com/docs',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat' },
      { id: 'deepseek-coder', name: 'DeepSeek Coder' }
    ]
  },
  
  ollama: {
    name: '本地/Ollama',
    defaultBaseUrl: 'http://localhost:11434/api',
    defaultModel: 'llama2',
    envKey: null, // 本地不需要 API Key
    docs: 'https://github.com/ollama/ollama/blob/main/docs/api.md',
    models: [
      { id: 'llama2', name: 'Llama 2' },
      { id: 'mistral', name: 'Mistral' },
      { id: 'codellama', name: 'Code Llama' }
    ],
    isLocal: true
  }
};

// 供应商列表（用于显示）
const PROVIDER_LIST = Object.entries(PROVIDER_CONFIGS).map(([key, config]) => ({
  key,
  name: config.name
}));

module.exports = {
  PROVIDER_CONFIGS,
  PROVIDER_LIST
};
