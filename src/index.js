const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');
const { Config, Database } = require('./config');
const Scanner = require('./scanner');
const AIConfig = require('./ai/config');
const { TagGenerator } = require('./core');

// 检测是否在 OpenClaw 环境
function isOpenClawEnvironment() {
  return !!process.env.OPENCLAW_SESSION || 
         !!process.env.OPENCLAW_GATEWAY;
}

class Tagger {
  constructor() {
    this.config = new Config();
    this.database = new Database();
    this.aiConfig = new AIConfig(this.config);
  }

  async mainMenu() {
    while (true) {
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
          { name: '🔄 重置数据库 (/ola reset)', value: 'reset' },
          { name: '🚪 退出', value: 'exit' }
        ]
      }]);

      if (action === 'exit') {
        console.log(chalk.blue('Till next time🖖'));
        return;
      }

      try {
        switch (action) {
          case 'new': await this.newLabels(); break;
          case 'edit': await this.editLabels(); break;
          case 'list': await this.listLabels(); break;
          case 'config': await this.configMenu(); break;
          case 'reset': await this.reset(); break;
        }
      } catch (error) {
        console.log(chalk.red(`\n❌ 操作出错: ${error.message}`));
        console.log(chalk.gray(error.stack));
      }
    }
  }

  async firstTimeSetup() {
    console.log(chalk.blue('=== Ola First-time Setup ===\n'));

    // 1. 选择知识库
    const vaults = this.findObsidianVaults();
    let selectedVault;
    
    if (vaults.length === 0) {
      console.log(chalk.yellow('未找到 Obsidian 知识库，请手动指定路径'));
      selectedVault = await this.promptForCustomVault();
    } else {
      const vaultChoices = [
        ...vaults.map((v, i) => ({ name: v.name, value: i })),
        { name: '↩️  手动指定路径', value: 'custom' }
      ];
      
      const { vaultIndex } = await inquirer.prompt([{
        type: 'list',
        name: 'vaultIndex',
        message: '选择 Obsidian 知识库：',
        choices: vaultChoices
      }]);
      
      if (vaultIndex === 'custom') {
        selectedVault = await this.promptForCustomVault();
        // 用户选择返回，退出设置
        if (selectedVault === null) {
          console.log(chalk.yellow('已取消设置'));
          return;
        }
      } else {
        selectedVault = vaults[vaultIndex];
      }
    }

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

    // 检测 OpenClaw 环境，非 OpenClaw 环境配置 AI 模型
    if (!isOpenClawEnvironment()) {
      console.log(chalk.blue('\n🔧 配置 AI 模型（可选）'));
      await this.aiConfig.configureAI();
    }

    // 询问处理模式（PRD 第 7 步）
    const { processMode } = await inquirer.prompt([{
      type: 'list',
      name: 'processMode',
      message: '是否处理所有文档，还是仅处理不包含标签的文档？',
      choices: [
        { name: '1. 处理所有文档', value: 'all' },
        { name: '2. 仅处理不包含标签的文档', value: 'untagged' },
        { name: '↩️  返回主菜单', value: 'back' }
      ]
    }]);

    if (processMode === 'back') {
      console.log(chalk.blue('\n返回主菜单...'));
      await this.mainMenu();
      return;
    }
    
    // 从主流程第 3 步开始执行（PRD 第 8 步）
    await this.newLabels(processMode === 'all');
  }

  findObsidianVaults() {
    const vaults = [];
    const home = require('os').homedir();
    
    // 多个可能的 Obsidian 路径
    const possiblePaths = [
      // iCloud (macOS)
      path.join(home, 'Library/Mobile Documents/iCloud~md~obsidian/Documents'),
      // 本地 Documents
      path.join(home, 'Documents/Obsidian'),
      path.join(home, 'Documents/obsidian'),
      // Linux 常见路径
      path.join(home, 'Obsidian'),
      // Windows 常见路径
      path.join(home, 'OneDrive/Documents/Obsidian'),
    ];
    
    const seen = new Set();
    
    for (const basePath of possiblePaths) {
      if (fs.existsSync(basePath)) {
        try {
          const entries = fs.readdirSync(basePath, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isDirectory()) {
              const vaultPath = path.join(basePath, entry.name);
              // 检查是否是有效的 Obsidian 知识库（有 .obsidian 文件夹）
              if (fs.existsSync(path.join(vaultPath, '.obsidian'))) {
                if (!seen.has(vaultPath)) {
                  seen.add(vaultPath);
                  vaults.push({
                    name: entry.name,
                    path: vaultPath
                  });
                }
              }
            }
          }
        } catch (err) {
          // 忽略无权限访问的目录
        }
      }
    }
    
    return vaults;
  }
  
  async promptForCustomVault() {
    while (true) {
      const { customPath } = await inquirer.prompt([{
        type: 'input',
        name: 'customPath',
        message: '请输入 Obsidian 知识库的完整路径（输入 `back` 返回）：'
      }]);
      
      const trimmedPath = customPath.trim();
      
      // 返回上一步
      if (trimmedPath === 'back') {
        return null;
      }
      
      if (!trimmedPath) {
        console.log(chalk.red('❗️ 路径不能为空'));
      } else if (!fs.existsSync(trimmedPath)) {
        console.log(chalk.red('❗️ 路径不存在'));
      } else if (!fs.existsSync(path.join(trimmedPath, '.obsidian'))) {
        console.log(chalk.red('❗️ 该路径不是有效的 Obsidian 知识库（缺少 .obsidian 文件夹）'));
      } else {
        // 路径有效
        return {
          name: path.basename(trimmedPath),
          path: trimmedPath
        };
      }
      
      // 提示按回车重新输入或输入 back 返回
      console.log(chalk.gray('按回车重新输入，或输入 `back` 返回上一步'));
      const { retry } = await inquirer.prompt([{
        type: 'input',
        name: 'retry',
        message: ''
      }]);
      
      if (retry.trim() === 'back') {
        return null;
      }
    }
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
        console.log(chalk.yellow('❗️ 所有文档都已打标！'));
        return;
      }
      console.log(chalk.blue(`\n发现 ${targetDocs.length} 个未打标文档\n`));
    }

    // 检查是否有 AI 配置
    const hasAI = this.aiConfig.hasAIConfig();
    let tagGenerator = null;
    
    if (hasAI) {
      try {
        tagGenerator = this.aiConfig.createTagGenerator({ maxTags: 5 });
        console.log(chalk.blue('🤖 使用 AI 生成标签\n'));
      } catch (error) {
        console.log(chalk.yellow(`⚠️  AI 配置错误: ${error.message}`));
        console.log(chalk.gray('将使用手动输入模式\n'));
      }
    } else {
      console.log(chalk.yellow('提示：未配置 AI 模型，使用手动输入模式'));
      console.log(chalk.gray('运行 "/ola config" 可配置 AI 模型\n'));
    }

    const totalDocs = targetDocs.length;

    for (let i = 0; i < targetDocs.length; i++) {
      const doc = targetDocs[i];
      const content = scanner.readDoc(doc.fullPath);
      const docExistingTags = scanner.extractExistingTags(content);
      
      // 每次处理文档前重新获取已有标签（包含刚添加的）
      const existingTags = this.database.getAllTags();
      
      console.log(chalk.cyan(`\n📄 [${i + 1}/${totalDocs}] ${doc.relativePath}`));
      
      let finalTags = [];
      
      if (tagGenerator) {
        // AI 生成标签模式
        try {
          console.log(chalk.gray('🤖 正在分析文档内容...'));
          
          const result = await tagGenerator.generate(
            { path: doc.relativePath, content },
            { existingTags, docTags: docExistingTags }
          );
          
          // 显示 AI 生成的标签
          console.log(chalk.blue('\n💡 AI 建议标签:'));
          result.tags.forEach((t, i) => {
            const icon = t.status === 'new' ? '🆕' : '✅';
            console.log(`   ${i + 1}. ${icon} ${t.tag}`);
          });
          
          if (result.summary) {
            console.log(chalk.gray(`   📋 ${result.summary}`));
          }
          
          // 用户确认
          const { action } = await inquirer.prompt([{
            type: 'list',
            name: 'action',
            message: '请选择操作：',
            choices: [
              { name: '✅ 全部添加', value: 'all' },
              { name: '✏️  部分添加', value: 'partial' },
              { name: '✍️  手动输入', value: 'manual' },
              { name: '⏭️  跳过', value: 'skip' }
            ]
          }]);
          
          if (action === 'skip') {
            console.log(chalk.gray('⏭️  已跳过'));
            continue;
          } else if (action === 'all') {
            finalTags = result.tags.map(t => t.tag);
          } else if (action === 'partial') {
            // 选择部分标签
            const { selectedTags } = await inquirer.prompt([{
              type: 'checkbox',
              name: 'selectedTags',
              message: '选择要添加的标签（空格选择，回车确认）：',
              choices: result.tags.map(t => ({
                name: `${t.tag} ${t.status === 'new' ? '(新增)' : ''}`,
                value: t.tag,
                checked: true
              }))
            }]);
            finalTags = selectedTags;
          } else {
            // 手动输入
            finalTags = await this.promptForManualTags(content, docExistingTags);
          }
          
        } catch (error) {
          console.log(chalk.red(`❌ AI 生成失败: ${error.message}`));
          console.log(chalk.gray('切换到手动输入模式'));
          finalTags = await this.promptForManualTags(content, docExistingTags);
        }
      } else {
        // 手动输入模式
        finalTags = await this.promptForManualTags(content, docExistingTags);
      }
      
      // 写入标签
      if (finalTags.length > 0) {
        const newContent = scanner.addTagsToDoc(content, finalTags, cfg.labelPosition);
        scanner.writeDoc(doc.fullPath, newContent);
        
        // 更新数据库
        const mtime = Math.floor(fs.statSync(doc.fullPath).mtimeMs / 1000);
        for (const tag of finalTags) {
          this.database.addTag(tag, doc.relativePath, mtime);
        }
        this.database.save();
        
        console.log(chalk.green(`✅ 已添加 ${finalTags.length} 个标签: ${finalTags.join(' ')}`));
      }
    }
    
    console.log(chalk.green(`\n🎉 完成！共处理 ${targetDocs.length} 个文档`));
  }
  
  /**
   * 手动输入标签
   */
  async promptForManualTags(content, existingTags) {
    console.log(chalk.gray(content.substring(0, 200) + '...\n'));
    
    if (existingTags.length > 0) {
      console.log(chalk.gray(`已有标签: ${existingTags.join(' ')}`));
    }
    
    const { tags } = await inquirer.prompt([{
      type: 'input',
      name: 'tags',
      message: '输入标签（用空格分隔，如：#AI #笔记），输入 `pass` 跳过：'
    }]);
    
    if (tags.trim() === 'pass' || !tags.trim()) {
      return [];
    }
    
    // 自动补全 # 号
    return tags.trim().split(/\s+/).map(t => {
      return t.startsWith('#') ? t : '#' + t;
    });
  }

  async editLabels() {
    while (true) {
      const tags = this.database.getAllTags();
      
      if (tags.length === 0) {
        console.log(chalk.yellow('❗️ 标签数据库为空'));
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
        choices: [...choices, { name: '↩️  返回', value: 'back' }]
      }]);

      if (selectedTag === 'back') {
        return;
      }

      const { action } = await inquirer.prompt([{
        type: 'list',
        name: 'action',
        message: `对 ${selectedTag} 执行操作：`,
        choices: [
          { name: '✏️  重命名', value: 'rename' },
          { name: '🗑️  删除', value: 'delete' },
          { name: '↩️  返回', value: 'back' }
        ]
      }]);

      if (action === 'back') {
        continue;
      }

      if (action === 'rename') {
        const { newTag } = await inquirer.prompt([{
          type: 'input',
          name: 'newTag',
          message: '输入新标签名（或按 Ctrl+C 取消）：',
          validate: input => input.startsWith('#') || '标签必须以 # 开头'
        }]);

        if (newTag) {
          await this.renameTag(selectedTag, newTag);
        }
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
    while (true) {
      const tags = this.database.getAllTags();
      
      if (tags.length === 0) {
        console.log(chalk.yellow('❗️ 标签数据库为空'));
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
        message: '选择标签查看关联文档：',
        choices: [...choices, { name: '↩️  返回', value: 'back' }]
      }]);

      if (selectedTag === 'back') {
        return;
      }

      const shouldReturn = await this.showTagDocs(selectedTag);
      if (shouldReturn) {
        return;
      }
    }
  }

  async showTagDocs(tag) {
    while (true) {
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
        message: '选择文档查看内容：',
        choices: [
          ...choices, 
          { name: '↩️  返回标签列表', value: 'back' },
          { name: '🚪 退出', value: 'exit' }
        ]
      }]);

      if (selectedDoc === 'back') {
        return false; // 返回标签列表，不退出 listLabels
      }
      
      if (selectedDoc === 'exit') {
        return true; // 完全退出
      }

      // 查看文档内容
      const scanner = new Scanner(cfg.vaultPath);
      const fullPath = path.join(cfg.vaultPath, selectedDoc);
      const content = scanner.readDoc(fullPath);
      
      console.log(chalk.blue(`\n=== ${selectedDoc} ===\n`));
      console.log(content);
      console.log(chalk.gray('\n--- 文档结束 ---\n'));
      
      // 按任意键继续
      await inquirer.prompt([{
        type: 'input',
        name: 'continue',
        message: '按回车继续...'
      }]);
    }
  }

  async configMenu() {
    while (true) {
      const cfg = this.config.load();
      
      console.log(chalk.blue('\n=== 当前配置 ===\n'));
      console.log(`1. 目标知识库: ${cfg.vaultName}`);
      console.log(`2. 目标文件夹: ${cfg.targetFolder}`);
      console.log(`3. 标签位置: ${cfg.labelPosition === 'tail' ? '尾部' : '头部'}`);
      
      // 显示 AI 配置状态
      if (this.aiConfig.hasAIConfig()) {
        console.log(`4. AI 模型: ${this.aiConfig.getCurrentConfigString()}`);
      } else if (!isOpenClawEnvironment()) {
        console.log(`4. AI 模型: 未配置`);
      }

      const choices = [
        { name: `1. 修改目标知识库 (当前: ${cfg.vaultName})`, value: 1 },
        { name: `2. 修改目标文件夹 (当前: ${cfg.targetFolder})`, value: 2 },
        { name: `3. 修改标签位置 (当前: ${cfg.labelPosition === 'tail' ? '尾部' : '头部'})`, value: 3 }
      ];
      
      // 非 OpenClaw 环境显示 AI 配置选项
      if (!isOpenClawEnvironment()) {
        choices.push({ name: '4. 修改模型配置', value: 4 });
      }
      
      choices.push({ name: '↩️  返回', value: 'back' });

      const { choice } = await inquirer.prompt([{
        type: 'list',
        name: 'choice',
        message: '选择要修改的配置：',
        choices
      }]);

      if (choice === 'back') {
        return;
      }

      if (choice === 1) {
        await this.changeVault(cfg);
      } else if (choice === 2) {
        await this.changeFolder(cfg);
      } else if (choice === 3) {
        await this.changePosition(cfg);
      } else if (choice === 4) {
        await this.aiConfig.configureAI();
      }
    }
  }

  async changeVault(cfg) {
    const vaults = this.findObsidianVaults();
    let newVault;
    
    const vaultChoices = [
      ...vaults.map((v, i) => ({ name: v.name, value: i })),
      { name: '📁 手动指定路径', value: 'custom' },
      { name: '↩️  返回', value: 'back' }
    ];
    
    const { vaultIndex } = await inquirer.prompt([{
      type: 'list',
      name: 'vaultIndex',
      message: '选择新的知识库：',
      choices: vaultChoices
    }]);

    if (vaultIndex === 'back') {
      return;
    }
    
    if (vaultIndex === 'custom') {
      newVault = await this.promptForCustomVault();
      // 用户选择返回，不更新
      if (newVault === null) {
        return;
      }
    } else {
      newVault = vaults[vaultIndex];
    }

    cfg.vaultPath = newVault.path;
    cfg.vaultName = newVault.name;
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
      })),
      { name: '↩️  返回', value: 'back' }
    ];

    const { targetFolder } = await inquirer.prompt([{
      type: 'list',
      name: 'targetFolder',
      message: '选择新的目标文件夹：',
      choices: folderChoices
    }]);

    if (targetFolder === 'back') {
      return;
    }

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
        { name: '文档头部', value: 'head' },
        { name: '↩️  返回', value: 'back' }
      ]
    }]);

    if (labelPosition === 'back') {
      return;
    }

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
