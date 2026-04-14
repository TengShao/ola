const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

class Scanner {
  constructor(vaultPath) {
    this.vaultPath = vaultPath;
  }

  async scanFolder(folderPath = '/') {
    const fullPath = folderPath === '/' 
      ? this.vaultPath 
      : path.join(this.vaultPath, folderPath);
    
    const pattern = path.join(fullPath, '**/*.md');
    const files = await glob(pattern, { 
      ignore: ['**/.obsidian/**', '**/.git/**', '**/node_modules/**']
    });
    
    return files.map(file => ({
      fullPath: file,
      relativePath: path.relative(this.vaultPath, file),
      mtime: fs.statSync(file).mtimeMs
    }));
  }

  scanFolders(maxDepth = 3) {
    const folders = [];
    const seen = new Set();
    
    const walk = (dir, depth, parentChain) => {
      if (depth > maxDepth) return;
      
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (entry.name.startsWith('.')) continue;
        
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(this.vaultPath, fullPath);
        
        if (seen.has(relativePath)) continue;
        seen.add(relativePath);
        
        const chain = [...parentChain, entry.name];
        folders.push({
          path: relativePath,
          chain: chain,
          depth: depth
        });
        
        walk(fullPath, depth + 1, chain);
      }
    };
    
    walk(this.vaultPath, 1, []);
    return folders;
  }

  readDoc(filePath) {
    return fs.readFileSync(filePath, 'utf8');
  }

  writeDoc(filePath, content) {
    fs.writeFileSync(filePath, content);
  }

  normalizeTag(tag) {
    return tag.startsWith('#') ? tag.trim() : `#${tag.trim()}`;
  }

  escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  getTagTokenRegex() {
    return /(^|[^\p{L}\p{N}_/])(#(?:[\p{L}\p{N}_-]+(?:\/[\p{L}\p{N}_-]+)*))/gu;
  }

  extractTagsFromText(text) {
    const tags = [];

    for (const match of text.matchAll(this.getTagTokenRegex())) {
      tags.push(match[2]);
    }

    return [...new Set(tags)];
  }

  extractExistingTags(content) {
    return this.extractTagsFromText(content);
  }

  hasTagSection(content) {
    return this.getTagSectionMatch(content) !== null;
  }

  getTagSectionMatch(content) {
    return content.match(/(\*\*(?:标签[：:]|Tags:)\*\*\s*)([^\n]*)/i);
  }

  buildTagSectionLine(prefix, tags) {
    return `${prefix}${tags.join(' ')}`;
  }

  addTagsToDoc(content, tags, position = 'tail') {
    // 检查是否已有标签段
    const normalizedTags = [...new Set(tags.map(tag => this.normalizeTag(tag)))];
    const tagSectionMatch = this.getTagSectionMatch(content);
    
    if (tagSectionMatch) {
      // 已有标签段，追加到现有标签
      const existingTags = this.extractTagsFromText(tagSectionMatch[2]);
      const allTags = [...new Set([...existingTags, ...normalizedTags])];
      const newTagLine = this.buildTagSectionLine(tagSectionMatch[1], allTags);
      return content.replace(tagSectionMatch[0], newTagLine);
    }
    
    // 没有标签段，创建新的
    const tagLine = `\n---\n\n**标签：** ${normalizedTags.join(' ')}\n`;
    
    if (position === 'head') {
      return tagLine + '\n' + content;
    } else {
      return content + tagLine;
    }
  }

  updateTagsInDoc(content, oldTags, newTags) {
    const oldTagLine = `**标签：** ${oldTags.join(' ')}`;
    const newTagLine = `**标签：** ${newTags.join(' ')}`;
    return content.replace(oldTagLine, newTagLine);
  }

  renameTagInDoc(content, oldTag, newTag) {
    const normalizedOldTag = this.normalizeTag(oldTag);
    const normalizedNewTag = this.normalizeTag(newTag);
    const tagSectionMatch = this.getTagSectionMatch(content);

    if (tagSectionMatch) {
      const existingTags = this.extractTagsFromText(tagSectionMatch[2]);
      const renamedTags = existingTags.map(tag =>
        tag.toLowerCase() === normalizedOldTag.toLowerCase() ? normalizedNewTag : tag
      );
      const uniqueTags = [...new Set(renamedTags)];
      const newTagLine = this.buildTagSectionLine(tagSectionMatch[1], uniqueTags);
      return content.replace(tagSectionMatch[0], newTagLine);
    }

    const tagRegex = this.getTagTokenRegex();
    return content.replace(tagRegex, (match, prefix, tag) => {
      if (tag.toLowerCase() !== normalizedOldTag.toLowerCase()) {
        return match;
      }
      return `${prefix}${normalizedNewTag}`;
    });
  }

  removeEmptyTagSection(content, tagSectionMatch) {
    const sectionText = tagSectionMatch[0];
    const escapedSectionText = this.escapeRegex(sectionText);
    const patterns = [
      new RegExp(`\\n---\\n\\n${escapedSectionText}\\n?`, 'i'),
      new RegExp(`^---\\n\\n${escapedSectionText}\\n?`, 'i'),
      new RegExp(`${escapedSectionText}\\n?`, 'i')
    ];

    let nextContent = content;
    for (const pattern of patterns) {
      if (pattern.test(nextContent)) {
        nextContent = nextContent.replace(pattern, '\n');
        break;
      }
    }

    return nextContent.replace(/\n{3,}/g, '\n\n').trimEnd();
  }

  removeTagFromDoc(content, tagToRemove) {
    const normalizedTag = this.normalizeTag(tagToRemove);
    const tagSectionMatch = this.getTagSectionMatch(content);

    if (tagSectionMatch) {
      const existingTags = this.extractTagsFromText(tagSectionMatch[2]);
      const remainingTags = existingTags.filter(
        tag => tag.toLowerCase() !== normalizedTag.toLowerCase()
      );

      if (remainingTags.length === 0) {
        return this.removeEmptyTagSection(content, tagSectionMatch);
      }

      const newTagLine = this.buildTagSectionLine(tagSectionMatch[1], remainingTags);
      return content.replace(tagSectionMatch[0], newTagLine);
    }

    const tagRegex = this.getTagTokenRegex();
    return content
      .replace(tagRegex, (match, prefix, tag) => {
        if (tag.toLowerCase() !== normalizedTag.toLowerCase()) {
          return match;
        }
        return prefix;
      })
      .replace(/[ \t]{2,}/g, ' ');
  }
}

module.exports = Scanner;
