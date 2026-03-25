/**
 * AdapterFactory — creates the correct IAgentEngine implementation
 * based on configuration.
 *
 * Usage:
 *   const engine = AdapterFactory.create("openclaw");
 *   const engine = AdapterFactory.createFromEnv(); // reads USE_MOCK_ADAPTER + AGENT_ENGINE
 *   const engine = await AdapterFactory.createWithFallback(); // try real, fallback to mock
 *
 * @module core/adapter/adapter-factory
 */

import type { IAgentEngine } from "./i-agent-engine";
import { MockAdapter } from "./mock-adapter";
import { OpenClawAdapter } from "./openclaw-adapter";
import { OpenClawClient } from "./openclaw-client";

/** Supported engine types */
export type EngineType = "mock" | "openclaw";

/**
 * Factory for creating IAgentEngine instances.
 * Centralizes adapter creation logic.
 */
export class AdapterFactory {
  /**
   * Create an engine adapter by name.
   *
   * @param engine - Engine type: "mock" or "openclaw"
   * @returns IAgentEngine implementation
   * @throws Error if engine type is unknown
   */
  static create(engine: string): IAgentEngine {
    switch (engine) {
      case "mock":
        return new MockAdapter();

      case "openclaw":
        return new OpenClawAdapter(new OpenClawClient());

      default:
        throw new Error(
          `Unknown engine type: "${engine}". Supported: mock, openclaw`
        );
    }
  }

  /**
   * Create engine from environment variables.
   *
   * Priority:
   * 1. USE_MOCK_ADAPTER=true → always MockAdapter (for development)
   * 2. AGENT_ENGINE=openclaw|mock → specific adapter
   * 3. Default → MockAdapter
   *
   * @returns IAgentEngine implementation
   */
  static createFromEnv(): IAgentEngine {
    // USE_MOCK_ADAPTER takes highest priority
    const useMock = process.env.USE_MOCK_ADAPTER;
    if (useMock === "true") {
      return new MockAdapter();
    }

    const engine = process.env.AGENT_ENGINE ?? "mock";
    return AdapterFactory.create(engine);
  }

  /**
   * Create engine with automatic fallback.
   * Tries OpenClaw first; if unreachable, falls back to MockAdapter.
   *
   * @returns IAgentEngine implementation (real or mock)
   */
  static async createWithFallback(): Promise<IAgentEngine> {
    // If explicitly mocked, skip connection test
    if (process.env.USE_MOCK_ADAPTER === "true") {
      return new MockAdapter();
    }

    try {
      const adapter = new OpenClawAdapter(new OpenClawClient());
      const healthy = await adapter.healthCheck();
      if (healthy) {
        return adapter;
      }
    } catch {
      // Connection failed, fall through to mock
    }

    // Fallback to mock
    return new MockAdapter();
  }
}

