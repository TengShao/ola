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

  extractExistingTags(content) {
    const tagRegex = /#\w+/g;
    const matches = content.match(tagRegex) || [];
    return [...new Set(matches)];
  }

  hasTagSection(content) {
    return content.includes('**标签：**');
  }

  addTagsToDoc(content, tags, position = 'tail') {
    // 检查是否已有标签段
    const tagSectionMatch = content.match(/\*\*标签：\*\*\s*([^\n]*)/);
    
    if (tagSectionMatch) {
      // 已有标签段，追加到现有标签
      const existingTags = tagSectionMatch[1].trim().split(/\s+/).filter(t => t);
      const allTags = [...new Set([...existingTags, ...tags])];
      const newTagLine = `**标签：** ${allTags.join(' ')}`;
      return content.replace(tagSectionMatch[0], newTagLine);
    }
    
    // 没有标签段，创建新的
    const tagLine = `\n---\n\n**标签：** ${tags.join(' ')}\n`;
    
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

  removeTagFromDoc(content, tagToRemove) {
    const tagRegex = new RegExp(`#${tagToRemove.replace('#', '')}\\b`, 'g');
    return content.replace(tagRegex, '').replace(/\s+/g, ' ').trim();
  }
}

module.exports = Scanner;
