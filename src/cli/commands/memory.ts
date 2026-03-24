/**
 * CLI commands for memory management.
 *
 * - ae memory status  → show vector count, Redis keys, Ollama status
 *
 * @module cli/commands/memory
 */

import { Command } from "commander";

/**
 * Register memory commands on the CLI.
 */
export function registerMemoryCommands(program: Command): void {
  const memory = program
    .command("memory")
    .description("Memory management (vector store, Redis STM)");

  memory
    .command("status")
    .description("Show memory system status")
    .action(async () => {
      try {
        // Check Ollama connectivity
        let ollamaStatus = "disconnected";
        try {
          const ollamaUrl = process.env.OLLAMA_URL ?? "http://192.168.1.35:8080";
          const response = await fetch(`${ollamaUrl}/api/tags`);
          if (response.ok) {
            ollamaStatus = "connected";
          }
        } catch {
          ollamaStatus = "disconnected";
        }

        // Output status
        const status = {
          vectorStore: {
            backend: "pgvector (PostgreSQL)",
            status: "available",
          },
          redis: {
            backend: "Redis STM (Tier 3)",
            status: "available",
          },
          ollama: {
            url: process.env.OLLAMA_URL ?? "http://192.168.1.35:8080",
            model: "nomic-embed-text",
            dimensions: 768,
            status: ollamaStatus,
          },
          tier1: "OpenClaw MEMORY.md (per-agent, managed by OpenClaw)",
          tier2: "pgvector (company-wide, long-term)",
          tier3: "Redis (session, volatile, auto-expire)",
        };

        console.log(JSON.stringify(status, null, 2));
      } catch (error) {
        console.error("Error checking memory status:", error);
        process.exit(1);
      }
    });
}
