# Ola

AI-powered tagging system for Obsidian notes with tag management and synchronization.

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

## License

MIT

## Author

TengShao
