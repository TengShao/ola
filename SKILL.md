name: obsidian-tagger
description: 自动为 Obsidian 文档添加标签，支持标签管理和同步
user-invocable: true
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["node"] },
        "install":
          [
            {
              "id": "node",
              "kind": "node",
              "package": "obsidian-tagger",
              "bins": ["obsidian-tagger"],
              "label": "Install Obsidian Tagger CLI (npm)",
            },
          ],
      },
  }

# Obsidian Tagger

自动为 Obsidian 文档添加标签，支持标签管理和同步。

## 触发词

| 指令 | 功能 |
|------|------|
| `/ola` | 主入口，询问用户需求 |
| `/ola new` | 执行打标签主流程 |
| `/ola edit` | 修改/删除标签 |
| `/ola list` | 查看标签库及关联文档 |
| `/ola config` | 修改配置 |
| `/ola reset` | 重置标签数据库 |

## 首次使用流程

1. 选择 Obsidian 知识库
2. 选择目标文件夹
3. 选择标签添加位置（头部/尾部）
4. 可选：扫描已有标签

## 配置存储

- 配置文件：`~/.openclaw/skills/obsidian-tagger/config.json`
- 标签数据库：`~/.openclaw/skills/obsidian-tagger/tag-database.json`

## 标签格式

```markdown
---

**标签：** #tag1 #tag2
```
