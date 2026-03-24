/**
 * Tests for ConversationLogger and DocumentIngester.
 * Uses mocked VectorStore and EmbeddingService.
 */

import { ConversationLogger } from "@/core/memory/conversation-logger";
import { DocumentIngester } from "@/core/memory/document-ingester";
import { VectorType } from "@/types/memory";

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
  embedBatch: jest.fn().mockResolvedValue([
    Array.from({ length: 768 }, () => 0.1),
    Array.from({ length: 768 }, () => 0.2),
  ]),
  getModelDimension: jest.fn().mockReturnValue(768),
});

describe("ConversationLogger", () => {
  let logger: ConversationLogger;
  let mockVectorStore: ReturnType<typeof createMockVectorStore>;
  let mockEmbedService: ReturnType<typeof createMockEmbedService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockVectorStore = createMockVectorStore();
    mockEmbedService = createMockEmbedService();
    logger = new ConversationLogger(
      mockVectorStore as never,
      mockEmbedService as never
    );
  });

  describe("logConversation", () => {
    it("should format, embed, and store conversation", async () => {
      const messages = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there!" },
      ];

      await logger.logConversation("agent-mkt", messages);

      expect(mockEmbedService.embed).toHaveBeenCalledWith(
        expect.stringContaining("Hello")
      );
      expect(mockVectorStore.store).toHaveBeenCalledWith(
        expect.stringContaining("Hello"),
        expect.any(Array),
        expect.objectContaining({
          type: VectorType.CONVERSATION,
          agentId: "agent-mkt",
        })
      );
    });

    it("should handle empty messages array", async () => {
      await logger.logConversation("agent-mkt", []);

      expect(mockEmbedService.embed).not.toHaveBeenCalled();
      expect(mockVectorStore.store).not.toHaveBeenCalled();
    });
  });

  describe("logTaskResult", () => {
    it("should log task description and result", async () => {
      const task = {
        id: "task-001",
        description: "Write marketing plan",
        result: "Plan completed with 5 campaigns",
        agentId: "agent-mkt",
      };

      await logger.logTaskResult(task);

      expect(mockEmbedService.embed).toHaveBeenCalledWith(
        expect.stringContaining("Write marketing plan")
      );
      expect(mockVectorStore.store).toHaveBeenCalledWith(
        expect.stringContaining("Plan completed"),
        expect.any(Array),
        expect.objectContaining({
          type: VectorType.CONVERSATION,
          taskId: "task-001",
        })
      );
    });
  });

  describe("logCorrection", () => {
    it("should embed and store correction for Self-Learning", async () => {
      const correction = {
        originalOutput: "Price: $100",
        correctedOutput: "Price: $100 + $30 labor",
        ruleExtracted: "Always include labor costs in pricing",
        agentId: "agent-fin",
      };

      await logger.logCorrection(correction);

      expect(mockEmbedService.embed).toHaveBeenCalledWith(
        expect.stringContaining("Always include labor costs")
      );
      expect(mockVectorStore.store).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.objectContaining({
          type: VectorType.CORRECTION,
          agentId: "agent-fin",
        })
      );
    });
  });
});

describe("DocumentIngester", () => {
  let ingester: DocumentIngester;
  let mockVectorStore: ReturnType<typeof createMockVectorStore>;
  let mockEmbedService: ReturnType<typeof createMockEmbedService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockVectorStore = createMockVectorStore();
    mockEmbedService = createMockEmbedService();
    ingester = new DocumentIngester(
      mockVectorStore as never,
      mockEmbedService as never
    );
  });

  describe("chunkText", () => {
    it("should split text into overlapping chunks", () => {
      const text = "word ".repeat(100); // 100 words
      const chunks = ingester.chunkText(text, 30, 5);

      expect(chunks.length).toBeGreaterThan(1);
      // Each chunk should be approximately chunkSize words
      expect(chunks[0].split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(35);
    });

    it("should return single chunk for short text", () => {
      const chunks = ingester.chunkText("Hello world", 500, 50);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe("Hello world");
    });
  });

  describe("ingestText", () => {
    it("should chunk, embed, and store text", async () => {
      const result = await ingester.ingestText(
        "This is a test document with some content.",
        "manual-input"
      );

      expect(result.source).toBe("manual-input");
      expect(result.chunksCreated).toBeGreaterThanOrEqual(1);
      expect(result.vectorIds).toHaveLength(result.chunksCreated);
    });
  });

  describe("ingest (file)", () => {
    it("should read file and ingest content", async () => {
      // Mock fs.readFile
      const fs = require("fs/promises");
      jest.spyOn(fs, "readFile").mockResolvedValue(
        "# Test Document\n\nThis is content for testing."
      );

      const result = await ingester.ingest("test.md");

      expect(result.source).toBe("test.md");
      expect(result.chunksCreated).toBeGreaterThanOrEqual(1);
      expect(mockEmbedService.embed).toHaveBeenCalled();
    });

    it("should throw for unsupported file types", async () => {
      await expect(ingester.ingest("file.exe")).rejects.toThrow(
        /unsupported/i
      );
    });
  });
});
