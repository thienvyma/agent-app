/**
 * RedisSTM — Short-Term Memory (Tier 3) using Redis.
 *
 * Stores volatile, auto-expiring session state, conversation cache,
 * and task progress. All data is JSON-serialized with TTL.
 *
 * Key patterns:
 *   agent:session:{agentId}  → SessionState (TTL 1h)
 *   agent:conv:{agentId}     → Message[] (TTL 2h)
 *   task:progress:{taskId}   → TaskProgress (TTL 24h)
 *
 * @module core/memory/redis-stm
 */

import type { SessionState, TaskProgress } from "@/types/memory";

/** Redis client interface (compatible with ioredis) */
interface RedisClient {
  set(key: string, value: string, mode: string, ttl: number): Promise<string>;
  get(key: string): Promise<string | null>;
  lpush(key: string, ...values: string[]): Promise<number>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  del(...keys: string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  expire(key: string, seconds: number): Promise<number>;
}

/**
 * Redis-based short-term memory for agent sessions.
 */
export class RedisSTM {
  /** TTL constants (seconds) */
  private static readonly TTL_SESSION = 3600;     // 1 hour
  private static readonly TTL_CONVERSATION = 7200; // 2 hours
  private static readonly TTL_TASK = 86400;        // 24 hours

  constructor(private readonly redis: RedisClient) {}

  /**
   * Set agent session state (expires in 1h).
   */
  async setSessionState(agentId: string, state: SessionState): Promise<void> {
    await this.redis.set(
      `agent:session:${agentId}`,
      JSON.stringify(state),
      "EX",
      RedisSTM.TTL_SESSION
    );
  }

  /**
   * Get agent session state.
   *
   * @returns SessionState or null if expired/not found
   */
  async getSessionState(agentId: string): Promise<SessionState | null> {
    const data = await this.redis.get(`agent:session:${agentId}`);
    if (!data) return null;
    return JSON.parse(data) as SessionState;
  }

  /**
   * Cache conversation messages (expires in 2h).
   */
  async cacheConversation(
    agentId: string,
    messages: Array<{ role: string; content: string }>
  ): Promise<void> {
    const key = `agent:conv:${agentId}`;
    for (const msg of messages) {
      await this.redis.lpush(key, JSON.stringify(msg));
    }
    await this.redis.expire(key, RedisSTM.TTL_CONVERSATION);
  }

  /**
   * Get recent conversation messages.
   *
   * @param agentId - Agent ID
   * @param limit - Max messages to return
   */
  async getRecentConversation(
    agentId: string,
    limit: number = 20
  ): Promise<Array<{ role: string; content: string }>> {
    const data = await this.redis.lrange(`agent:conv:${agentId}`, 0, limit - 1);
    return data.map((d) => JSON.parse(d) as { role: string; content: string });
  }

  /**
   * Set task progress (expires in 24h).
   */
  async setTaskProgress(taskId: string, progress: TaskProgress): Promise<void> {
    await this.redis.set(
      `task:progress:${taskId}`,
      JSON.stringify(progress),
      "EX",
      RedisSTM.TTL_TASK
    );
  }

  /**
   * Get task progress.
   */
  async getTaskProgress(taskId: string): Promise<TaskProgress | null> {
    const data = await this.redis.get(`task:progress:${taskId}`);
    if (!data) return null;
    return JSON.parse(data) as TaskProgress;
  }

  /**
   * Clear all Redis keys for an agent (session + conversation).
   */
  async clearAgent(agentId: string): Promise<void> {
    const keys = await this.redis.keys(`agent:*:${agentId}`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
