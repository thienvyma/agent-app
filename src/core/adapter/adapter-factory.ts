/**
 * AdapterFactory — creates the correct IAgentEngine implementation
 * based on configuration.
 *
 * Usage:
 *   const engine = AdapterFactory.create("openclaw");
 *   const engine = AdapterFactory.createFromEnv(); // reads AGENT_ENGINE env
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
   * Create engine from AGENT_ENGINE environment variable.
   * Defaults to "mock" if not set.
   *
   * @returns IAgentEngine implementation
   */
  static createFromEnv(): IAgentEngine {
    const engine = process.env.AGENT_ENGINE ?? "mock";
    return AdapterFactory.create(engine);
  }
}
