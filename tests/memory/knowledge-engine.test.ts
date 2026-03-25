/**
 * Tests for LightRAGClient and ContextBuilder.
 * Phase 12: Knowledge Engine.
 * Uses mocked fetch and services.
 */

import { LightRAGClient } from "@/core/memory/lightrag-client";
import { ContextBuilder } from "@/core/memory/context-builder";
import { VectorType } from "@/types/memory";
import type { LightRAGQueryMode } from "@/types/memory";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock VectorStore
const createMockVectorStore = () => ({
  store: jest.fn().mockResolvedValue("vec-001"),
  search: jest.fn().mockResolvedValue([]),
  delete: jest.fn(),
  update: jest.fn(),
});

// Mock EmbeddingService
const createMockEmbedService = () => ({
  embed: jest.fn().mockResolvedValue(Array.from({ length: 768 }, () => 0.1)),
  embedBatch: jest.fn(),
  getModelDimension: jest.fn().mockReturnValue(768),
});

// Mock PrismaClient
const createMockDb = () => ({
  agent: {
    findUnique: jest.fn(),
  },
  toolPermission: {
    findMany: jest.fn(),
  },
});

describe("LightRAGClient", () => {
  let client: LightRAGClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new LightRAGClient("http://localhost:9621");
  });

  describe("healthCheck", () => {
    it("should return true when service is healthy", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: "healthy" }),
      });

      const result = await client.healthCheck();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:9621/health",
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
    });

    it("should return false when service is down", async () => {
      mockFetch.mockRejectedValue(new Error("ECONNREFUSED"));

      const result = await client.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe("insert", () => {
    it("should POST document text to LightRAG service", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: "ok", doc_id: "doc-001" }),
      });

      await client.insert("Company revenue report Q1 2026", { source: "manual" });

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:9621/documents/text",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({ "Content-Type": "application/json" }),
          body: expect.stringContaining("Company revenue report"),
        })
      );
    });

    it("should throw on service error", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(
        client.insert("test text")
      ).rejects.toThrow(/LightRAG insert failed/);
    });
  });

  describe("query", () => {
    it("should POST query and return results", async () => {
      const mockResponse = {
        response: "Marketing agent produced Q1 campaign with 5 leads.",
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const results = await client.query("What did marketing do in Q1?", "hybrid");

      expect(results).toHaveLength(1);
      expect(results[0]!.content).toContain("Marketing agent");
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:9621/query",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("hybrid"),
        })
      );
    });

    it("should return empty array on connection error", async () => {
      mockFetch.mockRejectedValue(new Error("ECONNREFUSED"));

      const results = await client.query("test query", "naive");

      expect(results).toEqual([]);
    });

    it("should support all query modes", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ response: "result" }),
      });

      const modes: LightRAGQueryMode[] = ["naive", "local", "global", "hybrid"];
      for (const mode of modes) {
        await client.query("test", mode);
        expect(mockFetch).toHaveBeenCalledWith(
          "http://localhost:9621/query",
          expect.objectContaining({
            body: expect.stringContaining(mode),
          })
        );
      }
    });
  });

  describe("deleteDocument", () => {
    it("should DELETE document by ID", async () => {
      mockFetch.mockResolvedValue({ ok: true });

      await client.deleteDocument("doc-001");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:9621/documents/doc-001",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });
});

describe("ContextBuilder", () => {
  let builder: ContextBuilder;
  let mockVectorStore: ReturnType<typeof createMockVectorStore>;
  let mockEmbedService: ReturnType<typeof createMockEmbedService>;
  let mockDb: ReturnType<typeof createMockDb>;
  let mockLightrag: LightRAGClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockVectorStore = createMockVectorStore();
    mockEmbedService = createMockEmbedService();
    mockDb = createMockDb();

    // Mock LightRAGClient
    mockLightrag = new LightRAGClient("http://localhost:9621");
    jest.spyOn(mockLightrag, "healthCheck").mockResolvedValue(true);
    jest.spyOn(mockLightrag, "query").mockResolvedValue([
      { id: "lr-1", content: "Marketing completed Q1 campaign", score: 0.92 },
    ]);

    builder = new ContextBuilder(
      mockLightrag,
      mockVectorStore as never,
      mockEmbedService as never,
      mockDb as never
    );
  });

  describe("buildContext", () => {
    it("should build context combining LightRAG + VectorStore + corrections", async () => {
      // Mock agent data
      mockDb.agent.findUnique.mockResolvedValue({
        id: "a-mkt",
        name: "Marketing Manager",
        role: "marketing",
        sop: "Create content and manage campaigns",
      });

      // Mock VectorStore search for conversations
      mockVectorStore.search
        .mockResolvedValueOnce([
          { id: "v1", content: "Previous campaign report", score: 0.85, metadata: { type: VectorType.CONVERSATION } },
        ])
        .mockResolvedValueOnce([
          { id: "v2", content: "Always include budget in reports", score: 0.9, metadata: { type: VectorType.CORRECTION } },
        ]);

      const ctx = await builder.buildContext("Plan Q2 marketing campaign", "a-mkt");

      expect(ctx.agentSop).toContain("Create content");
      expect(ctx.knowledgeResults).toHaveLength(1);
      expect(ctx.pastExperience).toHaveLength(1);
      expect(ctx.corrections).toHaveLength(1);
      expect(ctx.lightragAvailable).toBe(true);
    });

    it("should degrade gracefully when LightRAG is down", async () => {
      jest.spyOn(mockLightrag, "healthCheck").mockResolvedValue(false);

      mockDb.agent.findUnique.mockResolvedValue({
        id: "a-mkt", name: "Marketing", role: "marketing", sop: "Do marketing",
      });
      mockVectorStore.search.mockResolvedValue([]);

      const ctx = await builder.buildContext("test task", "a-mkt");

      expect(ctx.lightragAvailable).toBe(false);
      expect(ctx.knowledgeResults).toEqual([]);
    });

    it("should throw when agent not found", async () => {
      mockDb.agent.findUnique.mockResolvedValue(null);

      await expect(
        builder.buildContext("test", "unknown-agent")
      ).rejects.toThrow(/not found/i);
    });
  });

  describe("formatContext", () => {
    it("should format TaskContext into structured string", () => {
      const ctx = {
        agentSop: "Manage marketing campaigns",
        knowledgeResults: [
          { id: "lr-1", content: "Q1 campaign had 5 leads", score: 0.9 },
        ],
        pastExperience: [
          { id: "v1", content: "Previous report sent on March 1", score: 0.8, metadata: { type: VectorType.CONVERSATION, source: "conv", timestamp: new Date() } },
        ],
        corrections: [
          { id: "v2", content: "Always include ROI metrics", score: 0.95, metadata: { type: VectorType.CORRECTION, source: "correction", timestamp: new Date() } },
        ],
        lightragAvailable: true,
      };

      const formatted = builder.formatContext(ctx);

      expect(formatted).toContain("=== ROLE ===");
      expect(formatted).toContain("Manage marketing campaigns");
      expect(formatted).toContain("=== RELEVANT KNOWLEDGE");
      expect(formatted).toContain("Q1 campaign had 5 leads");
      expect(formatted).toContain("=== PAST EXPERIENCE ===");
      expect(formatted).toContain("Previous report sent on March 1");
      expect(formatted).toContain("=== RULES FROM PAST CORRECTIONS ===");
      expect(formatted).toContain("Always include ROI metrics");
    });

    it("should handle empty context gracefully", () => {
      const ctx = {
        agentSop: "Do tasks",
        knowledgeResults: [],
        pastExperience: [],
        corrections: [],
        lightragAvailable: false,
      };

      const formatted = builder.formatContext(ctx);

      expect(formatted).toContain("=== ROLE ===");
      expect(formatted).toContain("Do tasks");
      expect(formatted).toContain("No knowledge graph results");
    });
  });
});
