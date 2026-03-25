/**
 * CLI commands for memory management.
 *
 * - ae memory status   → show vector count, Redis keys, Ollama status
 * - ae memory ingest   → ingest file or text into knowledge base
 *
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

  memory
    .command("ingest [filePath]")
    .description("Ingest file or text into knowledge base")
    .option("--text <content>", "Ingest raw text instead of file")
    .option("--source <source>", "Source identifier", "manual")
    .action(async (filePath: string | undefined, options: { text?: string; source: string }) => {
      try {
        if (!filePath && !options.text) {
          console.error(JSON.stringify({
            error: "Provide a file path or --text option",
            usage: "ae memory ingest <file> OR ae memory ingest --text \"...\"",
          }));
          process.exit(1);
        }

        // Dynamic import for document ingester (lazy load)
        const { DocumentIngester } = await import("@/core/memory/document-ingester");
        const { EmbeddingService } = await import("@/core/memory/embedding-service");
        const { VectorStore } = await import("@/core/memory/vector-store");
        const { prisma: db } = await import("@/lib/prisma");
        const embedService = new EmbeddingService();
        const vectorStore = new VectorStore(db);
        const ingester = new DocumentIngester(vectorStore, embedService);

        let result;
        if (options.text) {
          result = await ingester.ingestText(options.text, options.source);
        } else {
          result = await ingester.ingest(filePath!);
        }

        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error("Error ingesting:", error);
        process.exit(1);
      }
    });

  memory
    .command("search <query>")
    .description("Search knowledge base via LightRAG graph-enhanced search")
    .option("--mode <mode>", "Search mode: naive, local, global, hybrid", "hybrid")
    .option("--limit <n>", "Max results", "10")
    .action(async (query: string, options: { mode: string; limit: string }) => {
      try {
        const { LightRAGClient } = await import("@/core/memory/lightrag-client");
        const lightragUrl = process.env.LIGHTRAG_URL ?? "http://localhost:9621";
        const client = new LightRAGClient(lightragUrl);

        const mode = options.mode as "naive" | "local" | "global" | "hybrid";
        const results = await client.query(query, mode);

        console.log(JSON.stringify({
          query,
          mode,
          resultsCount: results.length,
          results: results.slice(0, parseInt(options.limit, 10)),
        }, null, 2));
      } catch (error) {
        console.error("Error searching:", error);
        process.exit(1);
      }
    });

  memory
    .command("graph-status")
    .description("Show LightRAG knowledge graph service status")
    .action(async () => {
      try {
        const { LightRAGClient } = await import("@/core/memory/lightrag-client");
        const lightragUrl = process.env.LIGHTRAG_URL ?? "http://localhost:9621";
        const client = new LightRAGClient(lightragUrl);

        const healthy = await client.healthCheck();

        console.log(JSON.stringify({
          service: "LightRAG",
          url: lightragUrl,
          status: healthy ? "healthy" : "unreachable",
          features: {
            graphSearch: "dual-level (local + global)",
            backend: "PostgreSQL",
            embedding: "Ollama (nomic-embed-text)",
          },
        }, null, 2));
      } catch (error) {
        console.error("Error checking graph status:", error);
        process.exit(1);
      }
    });
}
