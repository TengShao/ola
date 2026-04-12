# Ola 知识库

> Ola - AI-powered tagging system for Obsidian notes
> 持续更新中...

---

## 项目概述

**Ola** 是一个为 Obsidian 笔记提供 AI 智能标签的 CLI 工具,支持标签管理和同步。

### 核心功能
- 智能理解文档内容,自动生成标签
- 修改/删除标签,同步更新所有关联文档
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
| `Tagger` | 主控制器,处理所有用户交互流程 |
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
  有 AI 配置?
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
- **Ollama**: 本地运行,无需 API Key
- **Bailian**: 使用套餐专属 Base URL `coding.dashscope.aliyuncs.com`,兼容 OpenAI 接口协议

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
  - [x] 阿里云百炼提供商(已验证可用)
  - [x] 标签匹配算法(相似度计算)
  - [x] 集成到主流程 `/ola new`
- [x] **核心逻辑抽离 (2026-03-24)**
  - [x] `src/core/` 纯逻辑层
  - [x] `TagGenerator` - 生成+匹配整合
  - [x] `TagMatcher` - 相似度算法

### 进行中 🚧
- [ ] API Key 加密存储
- [ ] 更多 AI 提供商实现(OpenAI、Kimi 等)

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
   - 按 PRD 核心逻辑抽离原则,创建 `src/core/` 纯逻辑层
   - 实现 `TagGenerator` - 整合 AI 生成与标签匹配
   - 实现 `TagMatcher` - 多维度相似度算法(编辑距离、包含关系、中文相似度)

2. **AI 提供商实现**
   - 创建提供商抽象基类 `BaseAIProvider`
   - 实现提供商工厂 `ProviderFactory`
   - 实现 **阿里云百炼** `BailianProvider`(已验证可用)
   - 预留阿里云标准版、SiliconFlow 等提供商接口

3. **主流程集成**
   - 修改 `newLabels()` 方法,支持 AI 生成标签
   - 添加用户确认流程:全部添加 / 部分添加 / 手动输入 / 跳过
   - 无 AI 配置时自动降级到手动输入模式

4. **标签匹配算法**
   - 完全一致匹配(大小写不敏感)
   - 相似度匹配(阈值可配置,默认 0.6)
   - 标签合并与去重(限制最多 5 个)
   - 智能标记:existing / similar / new

**技术决策**:
- 使用工厂模式管理多提供商
- 相似度算法采用加权平均:包含关系 30% + 编辑距离 30% + 共同子串 20% + 中文相似度 20%
- 保持业务逻辑与 UI 分离,便于后续支持 Obsidian 插件

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

### Q: 如何检测是否在 OpenClaw 环境?
A: 检查环境变量 `OPENCLAW_SESSION` 或 `OPENCLAW_GATEWAY`

### Q: 为什么 Ollama 不需要 API Key?
A: Ollama 是本地运行的,不需要认证

### Q: 如何添加新的 AI 供应商?
A: 在 `src/ai/providers.js` 中添加配置,在 `src/ai/providers/` 中实现调用逻辑

---

## 相关链接

- GitHub: https://github.com/TengShao/ola
- 文档: README.md, SKILL.md
- PRD: Ola - Obsidian智能标签助手.md

---

---

## 项目路径变更

### 2026-04-12 - 动态路径检测

**配置目录现在根据运行环境动态确定：**

| 环境 | 配置目录 |
|------|---------|
| OpenClaw | `~/.openclaw/skills/ola/` |
| Hermes | `~/.hermes/skills/ola/` |
| CLI | `~/.ola/` |

**实现方式**：检测环境变量 `OPENCLAW_SESSION/GATEWAY`、`HERMES_HOME/ENV/GATEWAY` 来判断运行环境。

---

### 2026-03-24 迁移到新路径

**旧路径**: `~/.hermes/skills/ola`（OpenClaw 测试环境）
**新路径**: `/Users/teng/Drive/Project/ola`（正式开发环境）

**变更原因**:
- 项目架构已支持多平台(CLI / OpenClaw / Obsidian)
- 不应再放在 OpenClaw 专属目录下
- 独立路径便于版本管理和发布

**Git 历史**: 完整保留(23 个提交)

**OpenClaw 测试**:
- 旧路径 `~/.hermes/skills/ola` 保留用于测试
- 发布新版本时同步到旧路径进行测试

---

---

## Obsidian 插件开发知识

> 来源: [Obsidian Developer Documentation](https://docs.obsidian.md/)
> 记录时间: 2026-03-24
> 获取方式: 通过 Obsidian Publish API 获取官方文档

### 基础概念

**插件结构:**
```
my-plugin/
├── main.ts           # 插件入口，必须导出 Plugin 类
├── manifest.json     # 插件元数据
├── styles.css        # 样式（可选）
└── package.json      # npm 依赖
```

**manifest.json 字段（官方文档）:**

通用字段（插件和主题都可用）:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `author` | `string` | **Yes** | 作者名称 |
| `minAppVersion` | `string` | **Yes** | 最低 Obsidian 版本要求 |
| `name` | `string` | **Yes** | 显示名称 |
| `version` | `string` | **Yes** | 版本号，使用 Semantic Versioning (x.y.z) |
| `authorUrl` | `string` | No | 作者网站 URL |
| `fundingUrl` | `string` or `object` | No | 赞助链接 |

插件专属字段:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `description` | `string` | **Yes** | 插件描述 |
| `id` | `string` | **Yes** | 插件唯一标识符，不能包含 `obsidian` |
| `isDesktopOnly` | `boolean` | **Yes** | 是否使用 NodeJS 或 Electron API |

> **注意**: 本地开发时，`id` 必须与插件文件夹名称匹配，否则某些方法（如 `onExternalSettingsChange`）不会被调用。

**Ola 的 manifest.json 示例:**
```json
{
  "id": "ola",
  "name": "Ola",
  "version": "1.0.0",
  "minAppVersion": "0.15.0",
  "description": "AI-powered tagging system for Obsidian notes",
  "author": "TengShao",
  "authorUrl": "https://github.com/TengShao",
  "isDesktopOnly": false
}
```

### 核心 API

**Plugin 类生命周期:**
```typescript
import { Plugin } from 'obsidian';

export default class OlaPlugin extends Plugin {
  async onload() {
    // 插件加载时调用
    // 注册命令、设置面板、事件监听等
  }

  onunload() {
    // 插件卸载时调用
    // 清理资源
  }
}
```

**关键 API:**

| API | 用途 | Ola 使用场景 |
|-----|------|-------------|
| `app.vault` | 访问 Vault（文件系统） | 读取/写入文档 |
| `app.vault.getAbstractFileByPath()` | 获取文件 | 定位目标文档 |
| `app.vault.read()` | 读取文件内容 | 获取文档内容 |
| `app.vault.modify()` | 修改文件内容 | 写入标签 |
| `app.metadataCache` | 元数据缓存 | 获取已有标签 |
| `Plugin.addCommand()` | 注册命令 | `/ola new` 命令 |
| `Plugin.addSettingTab()` | 添加设置面板 | AI 配置界面 |
| `Modal` | 模态框 | 标签确认对话框 |
| `Setting` | 设置项 UI | 配置表单 |

### 文件操作示例

```typescript
// 读取文档
const file = app.vault.getAbstractFileByPath('笔记/文档.md');
const content = await app.vault.read(file);

// 修改文档（添加标签）
const newContent = content + '\n\n---\n**标签：** #AI #笔记';
await app.vault.modify(file, newContent);
```

### 命令注册

```typescript
this.addCommand({
  id: 'ola-tag-documents',
  name: 'Tag Documents',
  callback: () => {
    this.tagDocuments();
  }
});
```

### 设置面板

```typescript
class OlaSettingTab extends PluginSettingTab {
  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    
    new Setting(containerEl)
      .setName('AI Provider')
      .setDesc('Select AI provider for tag generation')
      .addDropdown(dropdown => dropdown
        .addOption('bailian', '阿里云百炼')
        .addOption('openai', 'OpenAI')
        .setValue(this.plugin.settings.provider)
        .onChange(async (value) => {
          this.plugin.settings.provider = value;
          await this.plugin.saveSettings();
        }));
  }
}
```

### 与 Ola Core 集成

**方案:**
```typescript
import { TaggerCore } from 'ola-core';

class OlaPlugin extends Plugin {
  core: TaggerCore;
  
  async onload() {
    // 初始化核心逻辑
    this.core = new TaggerCore({
      // 使用 Obsidian 的存储适配器
      storage: new ObsidianStorageAdapter(app),
      // 使用 Obsidian 的文件系统适配器
      fileSystem: new ObsidianFileSystemAdapter(app)
    });
    
    // 注册命令
    this.addCommand({
      id: 'ola-new',
      name: 'New Tags',
      callback: () => this.core.tagDocuments()
    });
  }
}
```

### 开发环境设置（官方教程）

**Step 1: 下载示例插件**
```bash
cd path/to/vault
mkdir -p .obsidian/plugins
cd .obsidian/plugins
git clone https://github.com/obsidianmd/obsidian-sample-plugin.git ola
```

**Step 2: 构建插件**
```bash
cd ola
npm install
npm run dev    # 持续编译，修改代码后自动重建
```

**Step 3: 启用插件**
1. Obsidian → Settings → Community plugins
2. Turn on community plugins
3. 启用 Sample Plugin

**Step 4: 更新 manifest**
1. 修改 `manifest.json` 中的 `id` 和 `name`
2. 重命名插件文件夹与 `id` 匹配
3. 重启 Obsidian

### 发布流程

1. **构建:** `npm run build` → 生成 `main.js`
2. **版本:** 更新 `manifest.json` 和 `package.json` 版本号
3. **发布:** GitHub Release 包含:
   - `main.js`
   - `manifest.json`
   - `styles.css` (可选)
4. **社区插件:** 提交 PR 到 [obsidian-releases](https://github.com/obsidianmd/obsidian-releases)

### 开发调试

**重要原则（官方警告）:**
> 开发插件时，一个错误可能导致 Vault 意外更改。为防止数据丢失，**绝不要在主 Vault 中开发插件**。始终使用专门用于插件开发的独立 Vault。

**热重载:**
- 使用 [hot-reload](https://github.com/pjeby/hot-reload) 插件
- 或手动在 Developer Console (Ctrl+Shift+I) 查看日志

**本地测试:**
```bash
# 创建测试 Vault
# 在 .obsidian/plugins/ 下创建软链接
ln -s /path/to/ola-plugin ~/.obsidian/plugins/ola
```

### 参考链接

- [官方文档](https://docs.obsidian.md/)
- [API 参考](https://docs.obsidian.md/Reference/TypeScript+API/)
- [示例插件](https://github.com/obsidianmd/obsidian-sample-plugin)

---

*最后更新: 2026-03-24*
*维护者: TengShao & Asuka 💕*
*开发路径: `/Users/teng/Drive/Project/ola`*
