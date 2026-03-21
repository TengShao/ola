# Ola 知识库

> Ola - AI-powered tagging system for Obsidian notes
> 持续更新中...

---

## 项目概述

**Ola** 是一个为 Obsidian 笔记提供 AI 智能标签的 CLI 工具，支持标签管理和同步。

### 核心功能
- 智能理解文档内容，自动生成标签
- 修改/删除标签，同步更新所有关联文档
- 便捷查看标签关联的文档
- 非 OpenClaw 环境支持配置自定义 AI 模型

---

## 技术架构

### 目录结构
```
ola/
├── bin/ola              # CLI 入口
├── src/
│   ├── index.js         # 主逻辑、流程控制
│   ├── config.js        # 配置和数据库管理
│   ├── scanner.js       # 文件扫描和标签操作
│   └── ai/              # AI 模块
│       ├── providers.js # 供应商配置
│       └── config.js    # AI 配置管理
├── package.json
├── README.md
├── SKILL.md             # OpenClaw 技能定义
└── KNOWLEDGE.md         # 本文件
```

### 关键类

| 类名 | 职责 |
|------|------|
| `Tagger` | 主控制器，处理所有用户交互流程 |
| `Config` | 管理 `config.json` 读写 |
| `Database` | 管理 `tag-database.json` 读写 |
| `Scanner` | 文件系统操作、标签提取和写入 |
| `AIConfig` | AI 模型配置管理 |

---

## 流程设计

### 首次使用流程
```
检测配置是否存在
  ↓ 不存在
  选择知识库 → 选择文件夹 → 选择标签位置
  ↓
  扫描已有标签
  ↓
  检测 OpenClaw 环境
    ↓ 非 OpenClaw
    询问是否配置 AI 模型
  ↓
  询问是否处理文档
```

### 主流程 (/ola new)
```
扫描文档 → 筛选未打标文档
  ↓
  有 AI 配置？
    ↓ 是
    调用 AI 生成标签
    ↓ 否
    手动输入标签
  ↓
  用户确认
  ↓
  写入标签 → 更新数据库
```

---

## AI 供应商配置

### 支持的供应商

| 供应商 | Base URL | 默认模型 | 环境变量 |
|--------|----------|---------|---------|
| OpenAI | `https://api.openai.com/v1` | gpt-4 | OPENAI_API_KEY |
| Anthropic | `https://api.anthropic.com/v1` | claude-3-opus | ANTHROPIC_API_KEY |
| Google | `https://generativelanguage.googleapis.com/v1beta` | gemini-pro | GOOGLE_API_KEY |
| OpenRouter | `https://openrouter.ai/api/v1` | openai/gpt-4 | OPENROUTER_API_KEY |
| Kimi | `https://api.moonshot.cn/v1` | moonshot-v1-8k | MOONSHOT_API_KEY |
| MiniMax | `https://api.minimax.chat/v1` | abab6.5-chat | MINIMAX_API_KEY |
| Z.ai | `https://api.z.ai/v1` | glm-4 | ZAI_API_KEY |
| Aliyun | `https://dashscope.aliyuncs.com/api/v1` | qwen-turbo | DASHSCOPE_API_KEY |
| DeepSeek | `https://api.deepseek.com/v1` | deepseek-chat | DEEPSEEK_API_KEY |
| Ollama | `http://localhost:11434/api` | llama2 | 无需 |

### 特殊处理
- **OpenRouter**: 需要额外 header `HTTP-Referer` 和 `X-Title`
- **MiniMax**: 需要额外参数 `group_id`
- **Ollama**: 本地运行，无需 API Key

---

## 配置存储

### config.json 结构
```json
{
  "vaultPath": "/path/to/vault",
  "vaultName": "Teng's Brain",
  "targetFolder": "/",
  "labelPosition": "tail",
  "initialized": true,
  "ai": {
    "provider": "openai",
    "model": "gpt-4",
    "apiKey": "encrypted:xxx",
    "baseUrl": "https://api.openai.com/v1"
  }
}
```

### tag-database.json 结构
```json
{
  "tags": {
    "#AI": {
      "docs": [
        { "path": "📥 Inbox/doc1.md", "mtime": 1742480400 }
      ]
    }
  }
}
```

---

## 开发规范

### Git 分支策略
```
main (稳定版)
  ↑
  └── develop (开发集成)
        ↑
        ├── feature/xxx (新功能)
        └── bugfix/xxx (修复)
```

### 提交规范
- `feat: xxx` - 新功能
- `fix: xxx` - 修复 bug
- `docs: xxx` - 文档更新
- `refactor: xxx` - 重构
- `test: xxx` - 测试

### 版本号规则
- `v0.x.x` - 开发版
- `v1.0.0` - 正式发布

---

## 调试命令

| 命令 | 功能 |
|------|------|
| `ola /ola-dev:reset-config` | 仅重置配置 |
| `ola /ola-dev:reset-db` | 仅重置数据库 |
| `ola /ola-dev:full-reset` | 完全重置 |
| `ola /ola-dev:show-config` | 显示配置 |
| `ola /ola-dev:show-db` | 显示数据库 |
| `ola /ola-dev:scan-only` | 仅扫描文档 |
| `ola /ola-dev:mock-ai` | 模拟 AI 生成 |
| `ola /ola-dev:ai-config` | 配置 AI 模型 |
| `ola /ola-dev:ai-show` | 显示 AI 配置 |
| `ola /ola-dev:ai-reset` | 清除 AI 配置 |

---

## 待办事项

### 已完成 ✅
- [x] 基础标签管理功能
- [x] 多路径知识库检测
- [x] 所有流程添加返回选项
- [x] AI 配置框架
- [x] 10 个 AI 供应商配置

### 进行中 🚧
- [ ] AI 标签生成实现
- [ ] OpenAI 提供商实现
- [ ] API Key 加密存储

### 计划中 📋
- [ ] 更多 AI 提供商实现
- [ ] 标签推荐算法优化
- [ ] 批量处理性能优化
- [ ] 测试覆盖率提升

---

## 常见问题

### Q: 如何检测是否在 OpenClaw 环境？
A: 检查环境变量 `OPENCLAW_SESSION` 或 `OPENCLAW_GATEWAY`

### Q: 为什么 Ollama 不需要 API Key？
A: Ollama 是本地运行的，不需要认证

### Q: 如何添加新的 AI 供应商？
A: 在 `src/ai/providers.js` 中添加配置，在 `src/ai/providers/` 中实现调用逻辑

---

## 相关链接

- GitHub: https://github.com/TengShao/ola
- 文档: README.md, SKILL.md
- PRD: Ola - Obsidian智能标签助手.md

---

*最后更新: 2026-03-21*
*维护者: TengShao & Asuka 💕*
