---
name: ola
description: AI 驱动的 Obsidian 笔记标签系统 - 扫描文档、生成标签、写入笔记。触发词：/ola
---

# Ola — Obsidian 智能标签助手

## 我是什么

Ola 是 Obsidian 笔记的智能标签助手。我可以帮你：
- 🔍 扫描知识库中的文档
- 📄 读取文档内容
- 🏷️ 将标签写入文档
- 📋 管理标签数据库（查看、重命名、删除）
- 🔄 同步更新所有关联文档的标签

**注意**：在 Hermes 环境中，AI 生成标签由 Agent 使用 Hermes 内置 AI 来完成，不需要在 Ola 中配置 AI。

## 触发词

| 触发词 | 说明 |
|--------|------|
| `/ola` | 主入口，无参数时进入交互模式（Terminal）或显示帮助 |

## 统一命令

所有环境（Terminal / OpenClaw / Hermes）使用同一套命令：

### 工作目录
```
/Users/teng/Drive/Project/ola
```

### 命令列表

#### 1. 查找 Vault
```bash
node bin/ola-cli vaults
```

#### 2. 查看配置
```bash
node bin/ola-cli config
```

#### 3. 配置 Ola
```bash
node bin/ola-cli config --vault "/path/to/vault" --folder "Notes"
```

#### 4. 扫描文档
```bash
# 扫描所有文档
node bin/ola-cli scan

# 仅扫描未打标文档
node bin/ola-cli scan --untagged
```

#### 5. 生成标签建议（需要 AI 配置）
```bash
node bin/ola-cli suggest --path "Notes/my-note.md"
```

#### 6. 应用标签到文档
```bash
node bin/ola-cli tag --path "Notes/my-note.md" --tags "AI,笔记"
```

#### 7. 列出所有标签
```bash
node bin/ola-cli list
```

#### 8. 重命名标签
```bash
node bin/ola-cli rename --old "AI" --new "人工智能"
```

#### 9. 删除标签
```bash
node bin/ola-cli delete --tag "AI"
```

## 典型工作流程

### 给未打标文档打标签（Hermes 模式）

```
用户：/ola new
Agent：
  1. 运行 scan --untagged 查找未打标文档
  2. 展示找到 N 个未打标文档
  3. 对每个文档：
     a. 运行 suggest --path <doc> 读取文档内容
     b. 用 Hermes 内置 AI 分析内容，生成标签建议
     c. 展示建议给用户
     d. 用户确认后，运行 tag --path <doc> --tags "AI,笔记"
  4. 完成
```

### 查看和管理标签

```
用户：/ola list
Agent：
  1. 运行 list
  2. 展示标签列表和关联文档数量
```

## 输出格式

所有命令默认输出 JSON 格式，方便 Agent 解析：

```json
{
  "tags": [
    { "name": "#AI", "docCount": 5, "docs": [...] },
    { "name": "#笔记", "docCount": 3, "docs": [...] }
  ]
}
```

**注意**：只有 `suggest` 命令在有 AI 配置时才会返回标签建议，否则返回空数组。

## 标签格式

```markdown
---

**标签：** #标签1 #标签2
```

## 核心文件位置

```
ola/
├── bin/
│   └── ola-cli           # CLI 入口
├── src/
│   ├── core/
│   │   ├── api.js       # Core API（业务逻辑层）
│   │   └── index.js     # TagGenerator 导出
│   ├── scanner.js        # 文件扫描、标签读写
│   ├── config.js         # Config + Database
│   └── ai/
│       └── config.js     # AI 模型配置
└── SKILL.md             # 本文件
```

## 配置

Ola 的配置文件在 `~/.ola/config.json`（CLI 模式）或根据环境变量确定。

**配置结构：**
```json
{
  "vaultPath": "/path/to/vault",
  "vaultName": "My Vault",
  "targetFolder": "/",
  "labelPosition": "tail",
  "initialized": true
}
```

## 注意事项

1. **标签自动补全 `#`** — 输入标签时不需要手动加 `#`，会自动补全
2. **mtime 检查** — 只有文档 mtime 发生变化时才重新打标
3. **标签去重** — 已有标签不会重复添加
4. **相对路径** — `--path` 参数使用相对于 vault 的路径
5. **无 AI 时** — `suggest` 命令会返回空建议，此时由 Agent 用内置 AI 分析文档内容

## 状态管理

Hermes 通过对话上下文管理状态，不需要 Ola 额外处理。Ola 每次调用都是独立的，返回结构化数据，由 Agent 来管理多轮对话。
