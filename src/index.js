const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');
const { Config, Database } = require('./config');
const Scanner = require('./scanner');

class Tagger {
  constructor() {
    this.config = new Config();
    this.database = new Database();
  }

  async mainMenu() {
    const cfg = this.config.load();
    
    if (!cfg) {
      console.log(chalk.yellow('首次使用，请先进行配置'));
      await this.firstTimeSetup();
      return;
    }

    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: '请选择操作：',
      choices: [
        { name: '🏷️  给文档打标签 (/ola new)', value: 'new' },
        { name: '✏️  修改标签 (/ola edit)', value: 'edit' },
        { name: '📋 查看标签列表 (/ola list)', value: 'list' },
        { name: '⚙️  修改配置 (/ola config)', value: 'config' },
        { name: '🔄 重置数据库 (/ola reset)', value: 'reset' }
      ]
    }]);

    switch (action) {
      case 'new': await this.newLabels(); break;
      case 'edit': await this.editLabels(); break;
      case 'list': await this.listLabels(); break;
      case 'config': await this.configMenu(); break;
      case 'reset': await this.reset(); break;
    }
  }

  async firstTimeSetup() {
    console.log(chalk.blue('=== Ola First-time Setup ===\n'));

    // 1. 选择知识库
    const vaults = this.findObsidianVaults();
    const { vaultIndex } = await inquirer.prompt([{
      type: 'list',
      name: 'vaultIndex',
      message: '选择 Obsidian 知识库：',
      choices: vaults.map((v, i) => ({ name: v.name, value: i }))
    }]);

    const selectedVault = vaults[vaultIndex];

    // 2. 选择目标文件夹
    const scanner = new Scanner(selectedVault.path);
    const folders = scanner.scanFolders();
    
    const folderChoices = [
      { name: '/ (整个知识库)', value: '/' },
      ...folders.map(f => ({
        name: `${'  '.repeat(f.depth - 1)}${f.chain[f.chain.length - 1]}`,
        value: f.path
      }))
    ];

    const { targetFolder } = await inquirer.prompt([{
      type: 'list',
      name: 'targetFolder',
      message: '选择目标文件夹：',
      choices: folderChoices
    }]);

    // 3. 选择标签位置
    const { labelPosition } = await inquirer.prompt([{
      type: 'list',
      name: 'labelPosition',
      message: '标签添加位置：',
      choices: [
        { name: '文档尾部', value: 'tail' },
        { name: '文档头部', value: 'head' }
      ]
    }]);

    // 保存配置
    const cfg = {
      vaultPath: selectedVault.path,
      vaultName: selectedVault.name,
      targetFolder,
      labelPosition,
      initialized: true
    };
    this.config.save(cfg);

    console.log(chalk.green('\n✅ 配置已保存！'));

    // 询问是否扫描已有标签
    const { scanExisting } = await inquirer.prompt([{
      type: 'confirm',
      name: 'scanExisting',
      message: '是否扫描目标文件夹，获取已有标签写入标签数据库？',
      default: true
    }]);

    if (scanExisting) {
      await this.scanExistingTags(cfg);
    }

    // 询问是否处理文档
    const { processDocs } = await inquirer.prompt([{
      type: 'confirm',
      name: 'processDocs',
      message: '是否立即处理文档打标签？',
      default: true
    }]);

    if (processDocs) {
      const { processMode } = await inquirer.prompt([{
        type: 'list',
        name: 'processMode',
        message: '处理模式：',
        choices: [
          { name: '处理所有文档', value: 'all' },
          { name: '仅处理不包含标签的文档', value: 'untagged' }
        ]
      }]);
      
      await this.newLabels(processMode === 'all');
    }
  }

  findObsidianVaults() {
    const vaults = [];
    const iCloudPath = path.join(
      require('os').homedir(),
      'Library/Mobile Documents/iCloud~md~obsidian/Documents'
    );
    
    if (fs.existsSync(iCloudPath)) {
      const entries = fs.readdirSync(iCloudPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          vaults.push({
            name: entry.name,
            path: path.join(iCloudPath, entry.name)
          });
        }
      }
    }

    // 也可以添加其他常见路径...
    return vaults;
  }

  async scanExistingTags(cfg) {
    console.log(chalk.blue('\n正在扫描已有标签...'));
    
    const scanner = new Scanner(cfg.vaultPath);
    const docs = await scanner.scanFolder(cfg.targetFolder);
    
    for (const doc of docs) {
      const content = scanner.readDoc(doc.fullPath);
      const tags = scanner.extractExistingTags(content);
      
      for (const tag of tags) {
        this.database.addTag(tag, doc.relativePath, doc.mtime);
      }
    }
    
    this.database.save();
    console.log(chalk.green(`✅ 已扫描 ${docs.length} 个文档，提取了 ${Object.keys(this.database.data.tags).length} 个标签`));
  }

  async newLabels(processAll = false) {
    const cfg = this.config.load();
    if (!cfg) {
      console.log(chalk.red('请先运行 /ola 进行配置'));
      return;
    }

    const scanner = new Scanner(cfg.vaultPath);
    const docs = await scanner.scanFolder(cfg.targetFolder);
    
    // 筛选文档
    let targetDocs;
    if (processAll) {
      targetDocs = docs;
      console.log(chalk.blue(`\n处理所有 ${docs.length} 个文档\n`));
    } else {
      // 仅筛选未打标的文档
      targetDocs = docs.filter(doc => {
        const mtime = Math.floor(doc.mtime / 1000);
        return !this.database.isDocTagged(doc.relativePath, mtime);
      });
      
      if (targetDocs.length === 0) {
        console.log(chalk.green('✅ 所有文档都已打标！'));
        return;
      }
      console.log(chalk.blue(`\n发现 ${targetDocs.length} 个未打标文档\n`));
    }

    // 这里应该调用 AI 生成标签，但 CLI 版本需要用户自己提供标签
    // 或者集成 OpenAI API
    console.log(chalk.yellow('提示：CLI 版本需要手动指定标签'));
    console.log(chalk.gray('（OpenClaw 集成版本会自动调用 AI 生成标签）\n'));

    for (const doc of targetDocs) {
      const content = scanner.readDoc(doc.fullPath);
      console.log(chalk.cyan(`\n📄 ${doc.relativePath}`));
      console.log(chalk.gray(content.substring(0, 200) + '...\n'));

      const { tags } = await inquirer.prompt([{
        type: 'input',
        name: 'tags',
        message: '输入标签（用空格分隔，如：#AI #笔记）：'
      }]);

      if (tags.trim()) {
        const tagList = tags.trim().split(/\s+/);
        const newContent = scanner.addTagsToDoc(content, tagList, cfg.labelPosition);
        scanner.writeDoc(doc.fullPath, newContent);

        // 更新数据库
        const mtime = Math.floor(fs.statSync(doc.fullPath).mtimeMs / 1000);
        for (const tag of tagList) {
          this.database.addTag(tag, doc.relativePath, mtime);
        }
        this.database.save();

        console.log(chalk.green('✅ 已添加标签'));
      }
    }
  }

  async editLabels() {
    const tags = this.database.getAllTags();
    
    if (tags.length === 0) {
      console.log(chalk.yellow('标签数据库为空'));
      return;
    }

    const choices = tags.map((tag, i) => ({
      name: `${tag} (${this.database.getTagDocs(tag).length} 个文档)`,
      value: tag
    }));

    const { selectedTag } = await inquirer.prompt([{
      type: 'list',
      name: 'selectedTag',
      message: '选择要修改的标签：',
      choices
    }]);

    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: `对 ${selectedTag} 执行操作：`,
      choices: [
        { name: '✏️  重命名', value: 'rename' },
        { name: '🗑️  删除', value: 'delete' }
      ]
    }]);

    if (action === 'rename') {
      const { newTag } = await inquirer.prompt([{
        type: 'input',
        name: 'newTag',
        message: '输入新标签名：',
        validate: input => input.startsWith('#') || '标签必须以 # 开头'
      }]);

      await this.renameTag(selectedTag, newTag);
    } else {
      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: `确定要删除 ${selectedTag} 吗？这将从所有文档中移除该标签。`,
        default: false
      }]);

      if (confirm) {
        await this.deleteTag(selectedTag);
      }
    }
  }

  async renameTag(oldTag, newTag) {
    const cfg = this.config.load();
    const scanner = new Scanner(cfg.vaultPath);
    const docs = this.database.getTagDocs(oldTag);

    for (const docInfo of docs) {
      const fullPath = path.join(cfg.vaultPath, docInfo.path);
      const content = scanner.readDoc(fullPath);
      const newContent = content.replace(
        new RegExp(oldTag.replace('#', '\\#'), 'g'),
        newTag
      );
      scanner.writeDoc(fullPath, newContent);
    }

    // 更新数据库
    this.database.data.tags[newTag] = this.database.data.tags[oldTag];
    delete this.database.data.tags[oldTag];
    this.database.save();

    console.log(chalk.green(`✅ 已将 ${oldTag} 重命名为 ${newTag}`));
  }

  async deleteTag(tag) {
    const cfg = this.config.load();
    const scanner = new Scanner(cfg.vaultPath);
    const docs = this.database.getTagDocs(tag);

    for (const docInfo of docs) {
      const fullPath = path.join(cfg.vaultPath, docInfo.path);
      const content = scanner.readDoc(fullPath);
      const newContent = scanner.removeTagFromDoc(content, tag);
      scanner.writeDoc(fullPath, newContent);
    }

    this.database.removeTag(tag);
    this.database.save();

    console.log(chalk.green(`✅ 已删除 ${tag}`));
  }

  async listLabels() {
    const tags = this.database.getAllTags();
    
    if (tags.length === 0) {
      console.log(chalk.yellow('标签数据库为空'));
      return;
    }

    console.log(chalk.blue('\n=== 所有标签 ===\n'));
    
    const choices = tags.map((tag, i) => ({
      name: `${i + 1}. ${tag} - ${this.database.getTagDocs(tag).length} 个文档`,
      value: tag
    }));

    const { selectedTag } = await inquirer.prompt([{
      type: 'list',
      name: 'selectedTag',
      message: '选择标签查看关联文档（或按 Ctrl+C 退出）：',
      choices: [...choices, { name: '退出', value: null }]
    }]);

    if (selectedTag) {
      await this.showTagDocs(selectedTag);
    }
  }

  async showTagDocs(tag) {
    const docs = this.database.getTagDocs(tag);
    const cfg = this.config.load();
    
    console.log(chalk.blue(`\n=== ${tag} 关联的文档 ===\n`));
    
    const choices = docs.map((doc, i) => ({
      name: `${i + 1}. ${doc.path}`,
      value: doc.path
    }));

    const { selectedDoc } = await inquirer.prompt([{
      type: 'list',
      name: 'selectedDoc',
      message: '选择文档查看内容（或按 Ctrl+C 返回）：',
      choices: [...choices, { name: '返回', value: null }]
    }]);

    if (selectedDoc) {
      const scanner = new Scanner(cfg.vaultPath);
      const fullPath = path.join(cfg.vaultPath, selectedDoc);
      const content = scanner.readDoc(fullPath);
      
      console.log(chalk.blue(`\n=== ${selectedDoc} ===\n`));
      console.log(content);
      console.log(chalk.gray('\n--- 文档结束 ---\n'));
    }
  }

  async configMenu() {
    const cfg = this.config.load();
    
    console.log(chalk.blue('\n=== 当前配置 ===\n'));
    console.log(`1. 目标知识库: ${cfg.vaultName}`);
    console.log(`2. 目标文件夹: ${cfg.targetFolder}`);
    console.log(`3. 标签位置: ${cfg.labelPosition === 'tail' ? '尾部' : '头部'}`);

    const { choice } = await inquirer.prompt([{
      type: 'list',
      name: 'choice',
      message: '选择要修改的配置：',
      choices: [
        { name: '1. 修改目标知识库', value: 1 },
        { name: '2. 修改目标文件夹', value: 2 },
        { name: '3. 修改标签位置', value: 3 },
        { name: '取消', value: null }
      ]
    }]);

    if (choice === 1) {
      await this.changeVault(cfg);
    } else if (choice === 2) {
      await this.changeFolder(cfg);
    } else if (choice === 3) {
      await this.changePosition(cfg);
    }
  }

  async changeVault(cfg) {
    const vaults = this.findObsidianVaults();
    const { vaultIndex } = await inquirer.prompt([{
      type: 'list',
      name: 'vaultIndex',
      message: '选择新的知识库：',
      choices: vaults.map((v, i) => ({ name: v.name, value: i }))
    }]);

    cfg.vaultPath = vaults[vaultIndex].path;
    cfg.vaultName = vaults[vaultIndex].name;
    cfg.targetFolder = '/';
    this.config.save(cfg);

    console.log(chalk.green('✅ 知识库已更新'));
  }

  async changeFolder(cfg) {
    const scanner = new Scanner(cfg.vaultPath);
    const folders = scanner.scanFolders();
    
    const folderChoices = [
      { name: '/ (整个知识库)', value: '/' },
      ...folders.map(f => ({
        name: `${'  '.repeat(f.depth - 1)}${f.chain[f.chain.length - 1]}`,
        value: f.path
      }))
    ];

    const { targetFolder } = await inquirer.prompt([{
      type: 'list',
      name: 'targetFolder',
      message: '选择新的目标文件夹：',
      choices: folderChoices
    }]);

    cfg.targetFolder = targetFolder;
    this.config.save(cfg);

    console.log(chalk.green('✅ 目标文件夹已更新'));
  }

  async changePosition(cfg) {
    const { labelPosition } = await inquirer.prompt([{
      type: 'list',
      name: 'labelPosition',
      message: '选择标签位置：',
      choices: [
        { name: '文档尾部', value: 'tail' },
        { name: '文档头部', value: 'head' }
      ]
    }]);

    cfg.labelPosition = labelPosition;
    this.config.save(cfg);

    console.log(chalk.green('✅ 标签位置已更新'));
  }

  async reset() {
    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: '重置后标签数据库会清空，并重新配置相关路径和规则，是否继续？',
      default: false
    }]);

    if (confirm) {
      this.database.clear();
      this.config.delete();
      console.log(chalk.green('✅ 已重置，请重新运行 /ola 进行配置'));
    }
  }
}

module.exports = Tagger;
