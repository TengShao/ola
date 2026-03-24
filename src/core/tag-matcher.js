/**
 * 标签匹配器
 * 将 AI 生成的候选标签与已有标签进行匹配
 */
class TagMatcher {
  constructor(options = {}) {
    this.similarityThreshold = options.similarityThreshold || 0.8;
  }

  /**
   * 匹配候选标签与已有标签
   * @param {Array} candidates - AI 生成的候选标签 [{ tag, relevance, ... }]
   * @param {Array} existingTags - 数据库中已有的标签 ['#tag1', '#tag2']
   * @param {Array} docExistingTags - 文档中已有的标签 ['#tag1']
   * @returns {Array} - 匹配结果 [{ tag, status, relevance, reason }]
   */
  match(candidates, existingTags = [], docExistingTags = []) {
    const results = [];
    const allExisting = [...new Set([...existingTags, ...docExistingTags])];
    
    for (const candidate of candidates) {
      const normalizedCandidate = this.normalizeTag(candidate.tag);
      
      // 1. 检查是否与文档已有标签完全一致
      const exactDocMatch = docExistingTags.find(t => 
        this.normalizeTag(t).toLowerCase() === normalizedCandidate.toLowerCase()
      );
      
      if (exactDocMatch) {
        results.push({
          tag: exactDocMatch,
          status: 'existing',
          relevance: candidate.relevance,
          reason: candidate.reason,
          category: candidate.category,
          note: '文档中已存在'
        });
        continue;
      }
      
      // 2. 检查是否与数据库标签完全一致
      const exactDbMatch = existingTags.find(t => 
        this.normalizeTag(t).toLowerCase() === normalizedCandidate.toLowerCase()
      );
      
      if (exactDbMatch) {
        results.push({
          tag: exactDbMatch,
          status: 'existing',
          relevance: candidate.relevance,
          reason: candidate.reason,
          category: candidate.category,
          note: '知识库中已存在'
        });
        continue;
      }
      
      // 3. 检查相似匹配
      const similarMatch = this.findSimilarTag(normalizedCandidate, existingTags);
      
      if (similarMatch && similarMatch.score >= this.similarityThreshold) {
        results.push({
          tag: similarMatch.tag,
          status: 'similar',
          relevance: candidate.relevance * similarMatch.score,
          reason: candidate.reason,
          category: candidate.category,
          note: `与候选标签 "${candidate.tag}" 相似度 ${(similarMatch.score * 100).toFixed(0)}%`
        });
        continue;
      }
      
      // 4. 新增标签
      results.push({
        tag: normalizedCandidate,
        status: 'new',
        relevance: candidate.relevance,
        reason: candidate.reason,
        category: candidate.category,
        note: '新增标签'
      });
    }
    
    return results;
  }

  /**
   * 查找相似标签
   * @param {string} candidate - 候选标签
   * @param {Array} existingTags - 已有标签
   * @returns {Object|null} - { tag, score }
   */
  findSimilarTag(candidate, existingTags) {
    let bestMatch = null;
    let bestScore = 0;
    
    const candidateLower = candidate.toLowerCase();
    const candidateBase = candidateLower.replace(/^#/, '');
    
    for (const existing of existingTags) {
      const existingLower = this.normalizeTag(existing).toLowerCase();
      const existingBase = existingLower.replace(/^#/, '');
      
      // 计算多种相似度
      const scores = [
        // 完全包含关系
        this.calculateContainmentScore(candidateBase, existingBase),
        // 编辑距离
        this.calculateEditDistanceScore(candidateBase, existingBase),
        // 共同子串
        this.calculateCommonSubstringScore(candidateBase, existingBase),
        // 语义相似（简单实现：关键词重叠）
        this.calculateKeywordOverlapScore(candidateBase, existingBase),
        // 中文相似度
        this.calculateChineseSimilarity(candidateBase, existingBase)
      ];
      
      // 取加权平均
      const score = scores[0] * 0.25 + scores[1] * 0.25 + scores[2] * 0.15 + scores[3] * 0.15 + scores[4] * 0.2;
      
      if (score > bestScore && score >= this.similarityThreshold) {
        bestScore = score;
        bestMatch = existing;
      }
    }
    
    return bestMatch ? { tag: bestMatch, score: bestScore } : null;
  }

  /**
   * 计算包含关系分数
   */
  calculateContainmentScore(str1, str2) {
    if (str1 === str2) return 1.0;
    
    // 完全包含
    if (str1.includes(str2) || str2.includes(str1)) {
      const longer = str1.length > str2.length ? str1 : str2;
      const shorter = str1.length > str2.length ? str2 : str1;
      // 根据包含比例调整分数
      return 0.7 + (shorter.length / longer.length) * 0.2;
    }
    
    // 部分包含（至少3个字符）
    for (let len = Math.min(str1.length, str2.length); len >= 3; len--) {
      for (let i = 0; i <= str1.length - len; i++) {
        const substr = str1.substring(i, i + len);
        if (str2.includes(substr)) {
          return (len / Math.max(str1.length, str2.length)) * 0.6;
        }
      }
    }
    
    return 0;
  }

  /**
   * 计算编辑距离分数
   */
  calculateEditDistanceScore(str1, str2) {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1.0;
    
    const distance = this.levenshteinDistance(str1, str2);
    return 1 - (distance / maxLen);
  }

  /**
   * Levenshtein 编辑距离
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * 计算共同子串分数
   */
  calculateCommonSubstringScore(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    let maxLen = 0;
    for (let i = 0; i < shorter.length; i++) {
      for (let j = i + 1; j <= shorter.length; j++) {
        const substr = shorter.substring(i, j);
        if (longer.includes(substr) && substr.length > maxLen) {
          maxLen = substr.length;
        }
      }
    }
    
    return maxLen / shorter.length;
  }

  /**
   * 计算关键词重叠分数
   */
  calculateKeywordOverlapScore(str1, str2) {
    const words1 = this.extractKeywords(str1);
    const words2 = this.extractKeywords(str2);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const intersection = words1.filter(w => words2.includes(w));
    return intersection.length / Math.max(words1.length, words2.length);
  }

  /**
   * 提取关键词
   */
  extractKeywords(str) {
    // 处理驼峰命名
    const camelCaseSplit = str.replace(/([a-z])([A-Z])/g, '$1 $2');
    
    // 按多种分隔符分割，支持中英文
    return camelCaseSplit
      .replace(/[_/\-\s]/g, ' ')
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 1);
  }

  /**
   * 计算中文相似度（基于共同字符）
   */
  calculateChineseSimilarity(str1, str2) {
    // 提取中文字符
    const chinese1 = str1.match(/[\u4e00-\u9fa5]/g) || [];
    const chinese2 = str2.match(/[\u4e00-\u9fa5]/g) || [];
    
    if (chinese1.length === 0 || chinese2.length === 0) return 0;
    
    // 计算共同中文字符
    const set1 = new Set(chinese1);
    const common = chinese2.filter(c => set1.has(c));
    
    // Jaccard 相似度
    const union = new Set([...chinese1, ...chinese2]).size;
    return union > 0 ? common.length / union : 0;
  }

  /**
   * 标准化标签
   */
  normalizeTag(tag) {
    if (!tag.startsWith('#')) {
      tag = '#' + tag;
    }
    return tag.trim();
  }

  /**
   * 合并标签（去重并限制数量）
   * @param {Array} matchedTags - 匹配后的标签
   * @param {Array} docExistingTags - 文档已有标签
   * @param {number} maxTags - 最大标签数
   * @returns {Array}
   */
  mergeTags(matchedTags, docExistingTags = [], maxTags = 5) {
    const result = [];
    const seen = new Set();
    
    // 1. 先加入文档已有标签
    for (const tag of docExistingTags) {
      const normalized = this.normalizeTag(tag).toLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        result.push({
          tag: tag,
          status: 'existing',
          relevance: 1.0,
          reason: '文档中已存在',
          category: 'existing'
        });
      }
    }
    
    // 2. 加入匹配后的标签（排除已有的）
    for (const item of matchedTags) {
      const normalized = this.normalizeTag(item.tag).toLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        result.push(item);
      }
    }
    
    // 3. 按相关性排序并限制数量
    return result
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, maxTags);
  }
}

module.exports = TagMatcher;
