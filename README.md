# Obsidian Tagger

自动为 Obsidian 文档添加标签，支持标签管理和同步。

## 功能

- 🏷️ **智能打标签** — 为文档自动生成并添加标签
- ✏️ **标签管理** — 修改、删除标签，同步更新所有关联文档
- 📋 **标签浏览** — 查看所有标签及关联文档
- ⚙️ **灵活配置** — 支持多个知识库、自定义目标文件夹、标签位置

## 安装

```bash
npm install -g obsidian-tagger
```

## 使用方法

### 首次配置

```bash
obsidian-tagger
# 或
obsidian-tagger /ola
```

按照提示选择：
1. Obsidian 知识库
2. 目标文件夹
3. 标签添加位置（头部/尾部）

### 给文档打标签

```bash
obsidian-tagger /ola-new
```

### 修改/删除标签

```bash
obsidian-tagger /ola-edit
```

### 查看标签列表

```bash
obsidian-tagger /ola-list
```

### 修改配置

```bash
obsidian-tagger /ola-config
```

### 重置数据库

```bash
obsidian-tagger /ola-reset
```

## OpenClaw 集成

在 OpenClaw 中使用：

```
/ola         # 主菜单
/ola new     # 打标签
/ola edit    # 编辑标签
/ola list    # 查看标签
/ola config  # 修改配置
/ola reset   # 重置
```

## 配置存储

- 配置文件：`~/.openclaw/skills/obsidian-tagger/config.json`
- 标签数据库：`~/.openclaw/skills/obsidian-tagger/tag-database.json`

## 标签格式

标签会被添加到文档末尾（或开头），格式如下：

```markdown
---

**标签：** #AI #笔记 #Obsidian
```

## 许可证

MIT

## 作者

TengShao
