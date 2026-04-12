---
name: ola
description: AI 驱动的 Obsidian 笔记标签系统 - 扫描文档、生成标签、写入笔记。触发词：/ola
---

# Ola — Obsidian 智能标签助手

## 我是什么

Ola 是你的 Obsidian 笔记智能标签助手。我可以帮你：
- 🔍 扫描 Obsidian 知识库中的文档
- 🤖 用 AI 分析文档内容，生成合适的标签
- 🏷️ 将标签写入文档（头部或尾部）
- 📋 管理标签数据库（查看、重命名、删除）
- 🔄 同步更新所有关联文档的标签

## 触发词

| 触发词 | 说明 |
|--------|------|
| `/ola` | 主入口，询问你想做什么 |
| `/ola new` | 扫描并给未打标的文档打标签 |
| `/ola list` | 查看所有标签及关联文档 |
| `/ola edit` | 编辑/重命名/删除标签 |
| `/ola config` | 查看/修改配置 |

## 工作流程

### `/ola new` — 打标签流程

**第一步：确认配置**
```
读取 ~/.hermes/skills/ola/config.json
- vaultPath: Obsidian 知识库路径
- targetFolder: 目标文件夹
- labelPosition: 标签位置（head/tail）
```
如果配置不存在，询问用户：
1. 选择 Obsidian 知识库
2. 选择目标文件夹
3. 选择标签位置（头部/尾部）

**第二步：扫描文档**
```bash
# 扫描目标文件夹中的所有 .md 文档
vault="你的vault路径"
target="目标文件夹路径"
find "$vault/$target" -name "*.md" -not -path "*/.obsidian/*"
```

**第三步：筛选未打标文档**
检查 `~/.hermes/skills/ola/tag-database.json`，排除已打标且 mtime 未变化的文档。

**第四步：AI 生成标签**
读取每个文档内容，调用 AI（如果有配置）或根据文档内容手动生成标签。

**第五步：写入标签**
标签格式：
```markdown
---

**标签：** #AI #笔记
```
添加到文档头部（`head`）或尾部（`tail`）。

**第六步：更新数据库**
```json
// ~/.hermes/skills/ola/tag-database.json
{
  "tags": {
    "#AI": { "docs": [{ "path": "笔记路径.md", "mtime": 1234567890 }] },
    "#笔记": { "docs": [{ "path": "笔记路径.md", "mtime": 1234567890 }] }
  }
}
```

### `/ola list` — 查看标签

读取 `tag-database.json`，展示所有标签及其关联文档数量。

### `/ola edit` — 编辑标签

选择一个标签后：
- **重命名**：替换所有关联文档中的标签，更新数据库
- **删除**：移除所有关联文档中的标签，从数据库删除

## 核心文件位置

```
~/.hermes/skills/ola/
├── config.json          # 配置文件（vaultPath, targetFolder, labelPosition）
├── tag-database.json    # 标签数据库
├── src/
│   ├── config.js        # Config + Database 类
│   ├── scanner.js       # Scanner 类（文件扫描、标签读写）
│   ├── ai/
│   │   ├── config.js    # AIConfig 类
│   │   └── providers/   # AI 提供商实现
│   └── core/
│       └── tagger-core.js  # TaggerCore 核心逻辑
```

## 标签格式

```markdown
---

**标签：** #标签1 #标签2
```

## AI 配置

Ola 支持多个 AI 提供商。在 `config.json` 中配置：
```json
{
  "ai": {
    "provider": "bailian",
    "model": "qwen-plus",
    "apiKey": "your-api-key",
    "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1"
  }
}
```

**支持的提供商**：bailian（阿里云百炼）、siliconflow、deepseek、openai、anthropic、ollama（本地）等。

## 注意事项

1. **交互式 CLI 无法在 Hermes 中直接调用** — Ola 的交互式 inquirer 流程不适用于 Hermes。请按照本 SKILL.md 的步骤，作为智能助手帮助用户完成标签工作。
2. **mtime 检查** — 只有文档 mtime 发生变化时才重新打标，避免重复处理。
3. **标签去重** — 已有标签不会重复添加。
4. **批量处理** — 建议逐个文档处理，给用户确认的机会。

## 使用示例

```
用户：/ola new
Asuka：
  1. 「好的！让我先检查一下配置～」
  2. 读取 config.json，确认 vault 和 targetFolder
  3. 「找到 5 个未打标文档，开始处理～」
  4. 逐个读取文档 → AI 生成标签 → 展示建议 → 用户确认 → 写入
  5. 「完成！已给 5 个文档打标签 ✅」
```
