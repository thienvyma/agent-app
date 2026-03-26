/**
 * OpenClaw Memory Tier-1 — reads agent MEMORY.md and daily logs.
 *
 * File locations:
 * - ~/.openclaw/agents/<agentId>/agent/MEMORY.md       ← curated facts
 * - ~/.openclaw/agents/<agentId>/memory/YYYY-MM-DD.md   ← daily logs
 *
 * Graceful degradation: returns "" when files/dirs don't exist.
 *
 * @module lib/openclaw-memory
 */

import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

/**
 * Get the OpenClaw agent directory path.
 *
 * @param agentId - Agent ID
 * @returns Absolute path to agent directory
 */
export function getAgentDir(agentId: string): string {
  return path.join(os.homedir(), ".openclaw", "agents", agentId);
}

/**
 * Read an agent's curated MEMORY.md file.
 * Returns empty string if file doesn't exist (graceful degradation).
 *
 * @param agentId - Agent ID
 * @returns MEMORY.md content or empty string
 */
export async function readAgentMemory(agentId: string): Promise<string> {
  const memoryPath = path.join(getAgentDir(agentId), "agent", "MEMORY.md");

  try {
    return await fs.readFile(memoryPath, "utf-8");
  } catch {
    return "";
  }
}

/**
 * Read an agent's daily log files (most recent N days).
 * Returns concatenated content of the last N daily logs.
 * Returns empty string if directory doesn't exist.
 *
 * @param agentId - Agent ID
 * @param days - Number of recent days to read (default: 2)
 * @returns Concatenated daily log content or empty string
 */
export async function readDailyLogs(agentId: string, days: number = 2): Promise<string> {
  const memoryDir = path.join(getAgentDir(agentId), "memory");

  try {
    const files = await fs.readdir(memoryDir);

    // Filter .md files and sort descending (most recent first)
    const mdFiles = files
      .filter((f) => typeof f === "string" && f.endsWith(".md"))
      .sort()
      .reverse()
      .slice(0, days);

    if (mdFiles.length === 0) {
      return "";
    }

    // Read each file and concatenate
    const contents: string[] = [];
    for (const file of mdFiles.reverse()) {
      try {
        const content = await fs.readFile(
          path.join(memoryDir, file as string),
          "utf-8"
        );
        contents.push(content);
      } catch {
        // Skip unreadable files
      }
    }

    return contents.join("\n\n---\n\n");
  } catch {
    return "";
  }
}
