name: ola
description: AI-powered tagging system for Obsidian notes with tag management and synchronization
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
              "package": "@tengshao/ola",
              "bins": ["ola"],
              "label": "Install Ola CLI (npm)",
            },
          ],
      },
  }

# Ola

AI-powered tagging system for Obsidian notes.

## Commands

| Command | Description |
|---------|-------------|
| `/ola` | Main menu |
| `/ola new` | Tag documents |
| `/ola edit` | Edit/delete tags |
| `/ola list` | List all tags |
| `/ola config` | Configuration |
| `/ola reset` | Reset database |

## First-time Setup

1. Select Obsidian vault
2. Choose target folder
3. Select tag position (head/tail)
4. Optional: Scan existing tags

## Configuration

- Config: `~/.openclaw/skills/ola/config.json`
- Database: `~/.openclaw/skills/ola/tag-database.json`

## Tag Format

```markdown
---

**Tags:** #tag1 #tag2
```
