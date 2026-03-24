const inquirer = require('inquirer');
const chalk = require('chalk');
const BaseAdapter = require('./base');

/**
 * CLI 交互适配器
 * 使用 inquirer 和 chalk 实现终端交互
 */
class CLIAdapter extends BaseAdapter {
  async show(message, type = 'info') {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red
    };
    console.log(colors[type](message));
  }

  async select(message, choices) {
    const { result } = await inquirer.prompt([{
      type: 'list',
      name: 'result',
      message,
      choices: choices.map(c => ({ name: c.name, value: c.value }))
    }]);
    return result;
  }

  async multiSelect(message, choices) {
    const { result } = await inquirer.prompt([{
      type: 'checkbox',
      name: 'result',
      message,
      choices: choices.map(c => ({ 
        name: c.name, 
        value: c.value,
        checked: c.checked || false
      }))
    }]);
    return result;
  }

  async input(message, options = {}) {
    const prompts = [{
      type: 'input',
      name: 'result',
      message,
      default: options.default
    }];
    
    if (options.validate) {
      prompts[0].validate = options.validate;
    }
    
    const { result } = await inquirer.prompt(prompts);
    return result;
  }

  async confirm(message, defaultValue = false) {
    const { result } = await inquirer.prompt([{
      type: 'confirm',
      name: 'result',
      message,
      default: defaultValue
    }]);
    return result;
  }

  async showTagSuggestions(doc, result) {
    console.log(chalk.cyan(`\n📄 ${doc.path}`));
    
    if (doc.existingTags && doc.existingTags.length > 0) {
      console.log(chalk.gray(`已有标签: ${doc.existingTags.join(' ')}`));
    }
    
    console.log(chalk.blue('\n💡 AI 建议标签:'));
    result.tags.forEach((t, i) => {
      const icon = t.status === 'new' ? '🆕' : '✅';
      console.log(`   ${i + 1}. ${icon} ${t.tag}`);
    });
    
    if (result.summary) {
      console.log(chalk.gray(`   📋 ${result.summary}`));
    }
  }

  async showDocList(docs) {
    console.log(chalk.blue('\n📄 文档列表:\n'));
    docs.forEach((doc, i) => {
      const tags = doc.existingTags?.length > 0 
        ? chalk.gray(`[${doc.existingTags.join(' ')}]`)
        : chalk.gray('[无标签]');
      console.log(`   ${i + 1}. ${doc.path} ${tags}`);
    });
  }

  async showTagList(tags) {
    console.log(chalk.blue('\n🏷️  标签列表:\n'));
    tags.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.tag} (${t.docCount} 个文档)`);
    });
  }
}

module.exports = CLIAdapter;
