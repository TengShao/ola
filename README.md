# Ola

AI-powered tagging system for Obsidian notes with tag management and synchronization.

[中文文档](#ola-中文文档)

## Features

- 🏷️ **Smart Tagging** — Automatically generate and add tags to your notes
- ✏️ **Tag Management** — Edit, rename, or delete tags across all linked documents
- 📋 **Tag Browser** — View all tags and their associated documents
- ⚙️ **Flexible Configuration** — Support multiple vaults, custom target folders, tag positions

## Installation

```bash
npm install -g ola
```

## Usage

### First-time Setup

```bash
ola
# or
ola /ola
```

Follow the prompts to configure:
1. Select your Obsidian vault
2. Choose target folder
3. Select tag position (head/tail)

### Tag Documents

```bash
ola /ola-new
```

### Edit/Delete Tags

```bash
ola /ola-edit
```

### List Tags

```bash
ola /ola-list
```

### Update Configuration

```bash
ola /ola-config
```

### Reset Database

```bash
ola /ola-reset
```

## OpenClaw Integration

Use in OpenClaw:

```
/ola         # Main menu
/ola new     # Tag documents
/ola edit    # Edit tags
/ola list    # List tags
/ola config  # Configuration
/ola reset   # Reset database
```

## Configuration

- Config file: `~/.openclaw/skills/ola/config.json`
- Tag database: `~/.openclaw/skills/ola/tag-database.json`

## Tag Format

Tags are added at the end (or beginning) of documents in this format:

```markdown
---

**Tags:** #AI #notes #obsidian
```

---

# Ola 中文文档

为 Obsidian 笔记提供 AI 智能标签系统，支持标签管理和同步。

## 功能特性

- 🏷️ **智能打标签** — 自动为笔记生成并添加标签
- ✏️ **标签管理** — 编辑、重命名或删除标签，同步更新所有关联文档
- 📋 **标签浏览** — 查看所有标签及其关联的文档
- ⚙️ **灵活配置** — 支持多个知识库、自定义目标文件夹、标签位置

## 安装

```bash
npm install -g ola
```

## 使用方法

### 首次配置

```bash
ola
# 或
ola /ola
```

按提示配置：
1. 选择 Obsidian 知识库
2. 选择目标文件夹
3. 选择标签位置（头部/尾部）

### 给文档打标签

```bash
ola /ola-new
```

### 编辑/删除标签

```bash
ola /ola-edit
```

### 查看标签列表

```bash
ola /ola-list
```

### 更新配置

```bash
ola /ola-config
```

### 重置数据库

```bash
ola /ola-reset
```

## OpenClaw 集成

在 OpenClaw 中使用：

```
/ola         # 主菜单
/ola new     # 给文档打标签
/ola edit    # 编辑标签
/ola list    # 查看标签列表
/ola config  # 修改配置
/ola reset   # 重置数据库
```

## 配置说明

- 配置文件：`~/.openclaw/skills/ola/config.json`
- 标签数据库：`~/.openclaw/skills/ola/tag-database.json`

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
