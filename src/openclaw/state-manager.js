/**
 * OpenClaw 状态管理器
 * 处理多轮消息交互
 */
class OpenClawStateManager {
  constructor() {
    this.states = new Map();
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
    return state;
  }

  /**
   * 获取状态
   */
  getState(sessionId) {
    return this.states.get(sessionId);
  }

  /**
   * 更新状态
   */
  updateState(sessionId, updates) {
    const state = this.states.get(sessionId);
    if (state) {
      Object.assign(state, updates);
    }
    return state;
  }

  /**
   * 删除状态
   */
  deleteState(sessionId) {
    this.states.delete(sessionId);
  }

  /**
   * 清理过期状态（30分钟）
   */
  cleanup() {
    const now = Date.now();
    const expireTime = 30 * 60 * 1000; // 30分钟
    
    for (const [sessionId, state] of this.states) {
      if (now - state.createdAt > expireTime) {
        this.states.delete(sessionId);
      }
    }
  }
}

module.exports = OpenClawStateManager;
