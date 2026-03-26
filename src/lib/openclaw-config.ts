/**
 * OpenClaw Config — read/write per-agent config in openclaw.json.
 *
 * File location: ~/.openclaw/openclaw.json
 *
 * Safely merges per-agent config without affecting other agents.
 * Graceful degradation: returns defaults when file missing.
 *
 * @module lib/openclaw-config
 */

import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

/** OpenClaw agent config subset */
export interface AgentToolsConfig {
  tools?: {
    allow?: string[];
    deny?: string[];
  };
}

/**
 * Get path to openclaw.json.
 */
export function getConfigPath(): string {
  return path.join(os.homedir(), ".openclaw", "openclaw.json");
}

/**
 * Read openclaw.json, returning parsed object.
 * Returns empty config if file doesn't exist.
 */
export async function readOpenClawConfig(): Promise<Record<string, unknown>> {
  try {
    const content = await fs.readFile(getConfigPath(), "utf-8");
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * Update a specific agent's config in openclaw.json.
 * Merges the provided config without affecting other agents.
 *
 * @param agentId - Agent ID to update
 * @param config - Partial config to merge (e.g., { tools: { allow: [...] } })
 */
export async function updateAgentConfig(
  agentId: string,
  config: AgentToolsConfig
): Promise<void> {
  const fullConfig = await readOpenClawConfig();

  // Navigate to agents.list array, create if missing
  const agents = (fullConfig as Record<string, unknown>).agents as Record<string, unknown> | undefined;
  if (!agents) {
    (fullConfig as Record<string, unknown>).agents = { list: [] };
  }

  const agentsObj = (fullConfig as Record<string, unknown>).agents as Record<string, unknown>;
  const list = (agentsObj.list ?? []) as Array<Record<string, unknown>>;

  // Find or create agent entry
  let agentEntry = list.find((a) => a.id === agentId);
  if (!agentEntry) {
    agentEntry = { id: agentId };
    list.push(agentEntry);
  }

  // Merge tools config
  if (config.tools) {
    agentEntry.tools = {
      ...(agentEntry.tools as Record<string, unknown> ?? {}),
      ...config.tools,
    };
  }

  agentsObj.list = list;

  // Write back
  const configPath = getConfigPath();
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(fullConfig, null, 2), "utf-8");
}
