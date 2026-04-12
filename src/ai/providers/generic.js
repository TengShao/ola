const BaseAIProvider = require('./base');

/**
 * 通用 AI 提供商
 * 支持任意 OpenAI 兼容 API（自定义 baseURL + model）
 */
class GenericProvider extends BaseAIProvider {
  constructor(config) {
    super(config);
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.apiKey = config.apiKey || '';
    this.model = config.model || 'gpt-4';
  }

  async generateTags(document, existingTags = []) {
    const requestBody = this.buildRequestBody(document, existingTags);
    
    console.log('🌐 Sending request to AI API...');
    console.log('   Base URL:', this.baseUrl);
    console.log('   Model:', this.model);
    console.log('   API Key:', this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'NOT SET');
    
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return this.parseResponse(data);
  }

  buildRequestBody(document, existingTags) {
    const systemPrompt = this.getSystemPrompt();
    const userPrompt = this.getUserPrompt(document, existingTags);

    return {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1500,
      temperature: 0.3
    };
  }

  parseResponse(data) {
    try {
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from API');
      }

      // 提取 JSON 部分
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                       content.match(/\{[\s\S]*\}/);
      
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
      const result = JSON.parse(jsonStr);

      // 标准化返回格式
      return {
        summary: result.summary || '',
        candidates: (result.candidates || []).map(c => ({
          tag: this.normalizeTag(c.tag),
          reason: c.reason || '',
          relevance: parseFloat(c.relevance) || 0.5,
          category: c.category || '其他'
        }))
      };
    } catch (error) {
      throw new Error(`Failed to parse response: ${error.message}`);
    }
  }

  getSystemPrompt() {
    return `你是 Ola，一位专业的 Obsidian 知识管理助手。你的任务是为笔记生成精准、实用的标签。

## 核心原则

### 1. 尊重用户选择
- 已有标签优先保留
- 已有标签合适 → 不动
- 已有标签太宽泛 → 建议更具体的子标签
- 已有标签重复 → 去重，保留最规范形式

### 2. 智能补充而非覆盖
- 分析已有标签，找出缺失的主题维度
- 补充能提升检索效率的标签
- 避免与已有标签同义或近义

### 3. 面向未来检索设计
想象用户会在什么场景下搜索这篇笔记：
- "我之前看过的那篇关于..."
- "找一下 #机器学习 相关的笔记"
- "所有 #项目/2024 的文档"

## 标签质量规范

### ✅ 推荐标签特征
- **具体明确**：#深度学习 比 #AI 更具体
- **层级清晰**：使用 #编程/JavaScript 而非 #JavaScript编程
- **领域相关**：紧扣文档核心主题
- **检索友好**：3-7 个标签，覆盖不同维度

### ❌ 避免的问题
- 过于宽泛（#笔记 #资料 #学习）
- 与已有标签重复（#人工智能 和 #AI）
- 临时性标记（#待完成 #今天看的）
- 包含空格或特殊字符

## 输出标签格式
- 使用 Obsidian 标准格式：#标签名
- 支持层级：#父标签/子标签
- 中英文根据文档语言决定`;
  }

  getUserPrompt(document, existingTags) {
    const existingTagsStr = existingTags.length > 0 
      ? existingTags.join(' ') 
      : '无';

    return `请为以下 Obsidian 文档生成标签候选：

---
**文档路径**: ${document.path}
**已有标签**: ${existingTagsStr}
---

**文档内容**:
${document.content.substring(0, 3000)}

---

请分析文档，按以下 JSON 格式返回：

\`\`\`json
{
  "summary": "文档核心主题总结（1-2句话）",
  "candidates": [
    {
      "rank": 1,
      "tag": "#标签名",
      "reason": "生成理由",
      "relevance": 0.95,
      "category": "主题|技术|场景|类型|其他"
    }
  ]
}
\`\`\`

要求：
1. 恰好返回 5 个候选标签
2. 按 relevance 从高到低排序（rank 1-5）
3. 不要考虑已有标签，专注于文档内容本身
4. 标签使用 Obsidian 格式：#标签名`;
  }

  normalizeTag(tag) {
    // 确保标签以 # 开头
    if (!tag.startsWith('#')) {
      tag = '#' + tag;
    }
    // 移除多余空格
    return tag.trim();
  }
}

module.exports = GenericProvider;
