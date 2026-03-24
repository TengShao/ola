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
│   ├── ai/              # AI 模块
│   │   ├── providers.js # 供应商配置
│   │   ├── config.js    # AI 配置管理
│   │   └── providers/   # 提供商实现
│   │       ├── base.js      # 抽象基类
│   │       ├── index.js     # 提供商工厂
│   │       ├── aliyun.js    # 阿里云 DashScope
│   │       ├── bailian.js   # 阿里云百炼
│   │       └── siliconflow.js # SiliconFlow
│   └── core/            # 核心逻辑层
│       ├── index.js         # 模块导出
│       ├── tag-generator.js # 标签生成器
│       └── tag-matcher.js   # 标签匹配器
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
| `TagGenerator` | AI 标签生成核心逻辑 |
| `TagMatcher` | 标签匹配与相似度算法 |
| `BaseAIProvider` | AI 提供商抽象基类 |
| `BailianProvider` | 阿里云百炼提供商实现 |

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
| Bailian | `https://coding.dashscope.aliyuncs.com/v1` | qwen3.5-plus | DASHSCOPE_API_KEY |
| DeepSeek | `https://api.deepseek.com/v1` | deepseek-chat | DEEPSEEK_API_KEY |
| Ollama | `http://localhost:11434/api` | llama2 | 无需 |
| SiliconFlow | `https://api.siliconflow.cn/v1` | Qwen/Qwen2.5-7B-Instruct | SILICONFLOW_API_KEY |

### 特殊处理
- **OpenRouter**: 需要额外 header `HTTP-Referer` 和 `X-Title`
- **MiniMax**: 需要额外参数 `group_id`
- **Ollama**: 本地运行，无需 API Key
- **Bailian**: 使用套餐专属 Base URL `coding.dashscope.aliyuncs.com`，兼容 OpenAI 接口协议

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
- [x] **AI 标签生成核心实现 (2026-03-24)**
  - [x] 提供商抽象基类与工厂模式
  - [x] 阿里云百炼提供商（已验证可用）
  - [x] 标签匹配算法（相似度计算）
  - [x] 集成到主流程 `/ola new`
- [x] **核心逻辑抽离 (2026-03-24)**
  - [x] `src/core/` 纯逻辑层
  - [x] `TagGenerator` - 生成+匹配整合
  - [x] `TagMatcher` - 相似度算法

### 进行中 🚧
- [ ] API Key 加密存储
- [ ] 更多 AI 提供商实现（OpenAI、Kimi 等）

### 计划中 📋
- [ ] 标签推荐算法优化
- [ ] 批量处理性能优化
- [ ] 测试覆盖率提升

---

## 开发日志

### 2026-03-24 - AI 标签生成实现

**开发者**: Asuka & Teng 💕

**今日完成**:

1. **核心架构重构**
   - 按 PRD 核心逻辑抽离原则，创建 `src/core/` 纯逻辑层
   - 实现 `TagGenerator` - 整合 AI 生成与标签匹配
   - 实现 `TagMatcher` - 多维度相似度算法（编辑距离、包含关系、中文相似度）

2. **AI 提供商实现**
   - 创建提供商抽象基类 `BaseAIProvider`
   - 实现提供商工厂 `ProviderFactory`
   - 实现 **阿里云百炼** `BailianProvider`（已验证可用）
   - 预留阿里云标准版、SiliconFlow 等提供商接口

3. **主流程集成**
   - 修改 `newLabels()` 方法，支持 AI 生成标签
   - 添加用户确认流程：全部添加 / 部分添加 / 手动输入 / 跳过
   - 无 AI 配置时自动降级到手动输入模式

4. **标签匹配算法**
   - 完全一致匹配（大小写不敏感）
   - 相似度匹配（阈值可配置，默认 0.6）
   - 标签合并与去重（限制最多 5 个）
   - 智能标记：existing / similar / new

**技术决策**:
- 使用工厂模式管理多提供商
- 相似度算法采用加权平均：包含关系 30% + 编辑距离 30% + 共同子串 20% + 中文相似度 20%
- 保持业务逻辑与 UI 分离，便于后续支持 Obsidian 插件

**测试结果**:
```
文档: 深度学习入门指南
AI 生成标签:
  1. #深度学习 (相关度: 0.98)
  2. #神经网络 (相关度: 0.92)
  3. #机器学习 (相关度: 0.85)
  4. #算法/反向传播 (相关度: 0.78)
  5. #教程/入门 (相关度: 0.7)

匹配结果:
  ✅ #机器学习 → 匹配已有标签
  🆕 其他 4 个 → 新增标签
```

**提交记录**:
- `a0e8590` - feat: Implement AI tag generation with Bailian provider
- `519cee7` - feat: Integrate AI tag generation into main workflow

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

*最后更新: 2026-03-24*
*维护者: TengShao & Asuka 💕*
