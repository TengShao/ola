const fs = require('fs');
const path = require('path');
const { CONFIG_DIR } = require('../config');

/**
 * OpenClaw 状态管理器
 * 处理多轮消息交互
 */
class OpenClawStateManager {
  constructor() {
    this.states = new Map();
    this.stateFile = path.join(CONFIG_DIR, 'openclaw-states.json');
    this.loadFromDisk();
  }

  loadFromDisk() {
    if (!fs.existsSync(this.stateFile)) {
      return;
    }

    try {
      const rawStates = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
      this.states = new Map(Object.entries(rawStates));
    } catch (error) {
      this.states = new Map();
    }
  }

  saveToDisk() {
    const serializedStates = Object.fromEntries(this.states.entries());
    fs.mkdirSync(path.dirname(this.stateFile), { recursive: true });
    fs.writeFileSync(this.stateFile, JSON.stringify(serializedStates, null, 2));
  }

  /**
   * 创建新会话状态
   */
  createState(sessionId, initialData = {}) {
    const state = {
      sessionId,
      step: 'idle', // idle | confirm_tags | select_partial | input_manual | complete
      data: initialData,
      createdAt: Date.now()
    };
    this.states.set(sessionId, state);
    this.saveToDisk();
    return state;
  }

  /**
   * 获取状态
   */
  getState(sessionId) {
    this.cleanup();
    return this.states.get(sessionId);
  }

  /**
   * 更新状态
   */
  updateState(sessionId, updates) {
    const state = this.states.get(sessionId);
    if (state) {
      Object.assign(state, updates);
      this.saveToDisk();
    }
    return state;
  }

  /**
   * 删除状态
   */
  deleteState(sessionId) {
    this.states.delete(sessionId);
    this.saveToDisk();
  }

  /**
   * 清理过期状态（30分钟）
   */
  cleanup() {
    const now = Date.now();
    const expireTime = 30 * 60 * 1000; // 30分钟
    let changed = false;
    
    for (const [sessionId, state] of this.states) {
      if (now - state.createdAt > expireTime) {
        this.states.delete(sessionId);
        changed = true;
      }
    }

    if (changed) {
      this.saveToDisk();
    }
  }
}

module.exports = OpenClawStateManager;
