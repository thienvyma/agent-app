/**
 * Tests for VectorStore, EmbeddingService, and RedisSTM.
 * Uses mocked Prisma, fetch, and Redis.
 */

import { VectorStore } from "@/core/memory/vector-store";
import { EmbeddingService } from "@/core/memory/embedding-service";
import { RedisSTM } from "@/core/memory/redis-stm";
import { VectorType } from "@/types/memory";

// Mock Prisma
const createMockDb = () => ({
  $queryRaw: jest.fn(),
  $executeRaw: jest.fn(),
});

// Mock Redis
const createMockRedis = () => ({
  set: jest.fn(),
  get: jest.fn(),
  lpush: jest.fn(),
  lrange: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  expire: jest.fn(),
});

// Mock fetch for Ollama
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("EmbeddingService", () => {
  let service: EmbeddingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EmbeddingService("http://192.168.1.35:8080");
  });

  describe("embed", () => {
    it("should return embedding vector from Ollama", async () => {
      const fakeEmbedding = Array.from({ length: 768 }, (_, i) => i * 0.001);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ embedding: fakeEmbedding }),
      });

      const result = await service.embed("Hello world");

      expect(result).toHaveLength(768);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://192.168.1.35:8080/api/embeddings",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("nomic-embed-text"),
        })
      );
    });

    it("should throw when Ollama is not reachable", async () => {
      mockFetch.mockRejectedValue(new Error("ECONNREFUSED"));

      await expect(service.embed("test")).rejects.toThrow(/ECONNREFUSED/);
    });
  });

  describe("embedBatch", () => {
    it("should embed multiple texts", async () => {
      const fakeEmbedding = Array.from({ length: 768 }, () => 0.5);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ embedding: fakeEmbedding }),
      });

      const results = await service.embedBatch(["text1", "text2"]);

      expect(results).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("getModelDimension", () => {
    it("should return 768 for nomic-embed-text", () => {
      expect(service.getModelDimension()).toBe(768);
    });
  });
});

describe("VectorStore", () => {
  let store: VectorStore;
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    store = new VectorStore(mockDb as never);
  });

  describe("store", () => {
    it("should insert vector via raw SQL", async () => {
      mockDb.$queryRaw.mockResolvedValue([{ id: "vec-001" }]);

      const id = await store.store(
        "Hello world",
        [0.1, 0.2, 0.3],
        {
          type: VectorType.DOCUMENT,
          source: "test",
          timestamp: new Date(),
        }
      );

      expect(id).toBe("vec-001");
      expect(mockDb.$queryRaw).toHaveBeenCalled();
    });
  });

  describe("search", () => {
    it("should return results sorted by cosine similarity", async () => {
      mockDb.$queryRaw.mockResolvedValue([
        { id: "v1", content: "hello world", score: 0.95, metadata: '{"type":"DOCUMENT"}' },
        { id: "v2", content: "hi there", score: 0.82, metadata: '{"type":"CONVERSATION"}' },
      ]);

      const results = await store.search([0.1, 0.2, 0.3], 5);

      expect(results).toHaveLength(2);
      expect(results[0].score).toBe(0.95);
    });
  });

  describe("delete", () => {
    it("should delete vector by id", async () => {
      mockDb.$executeRaw.mockResolvedValue(1);

      await store.delete("vec-001");

      expect(mockDb.$executeRaw).toHaveBeenCalled();
    });
  });
});

describe("RedisSTM", () => {
  let stm: RedisSTM;
  let mockRedis: ReturnType<typeof createMockRedis>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedis = createMockRedis();
    stm = new RedisSTM(mockRedis as never);
  });

  describe("setSessionState / getSessionState", () => {
    it("should store and retrieve session state", async () => {
      const state = {
        currentTaskId: "t1",
        conversationHistory: ["msg1"],
        lastActivity: new Date(),
        tokenCount: 100,
      };
      mockRedis.set.mockResolvedValue("OK");
      mockRedis.get.mockResolvedValue(JSON.stringify(state));

      await stm.setSessionState("a-mkt", state);
      const result = await stm.getSessionState("a-mkt");

      expect(mockRedis.set).toHaveBeenCalledWith(
        "agent:session:a-mkt",
        expect.any(String),
        "EX",
        3600
      );
      expect(result?.tokenCount).toBe(100);
    });

    it("should return null when no session exists", async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await stm.getSessionState("unknown");

      expect(result).toBeNull();
    });
  });

  describe("cacheConversation / getRecentConversation", () => {
    it("should cache and retrieve recent messages", async () => {
      const messages = [{ role: "user", content: "hello" }];
      mockRedis.lpush.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.lrange.mockResolvedValue([JSON.stringify(messages[0])]);

      await stm.cacheConversation("a-mkt", messages as never[]);
      const result = await stm.getRecentConversation("a-mkt", 10);

      expect(result).toHaveLength(1);
    });
  });

  describe("clearAgent", () => {
    it("should delete all keys for an agent", async () => {
      mockRedis.keys.mockResolvedValue(["agent:session:a-mkt", "agent:conv:a-mkt"]);
      mockRedis.del.mockResolvedValue(2);

      await stm.clearAgent("a-mkt");

      expect(mockRedis.keys).toHaveBeenCalledWith("agent:*:a-mkt");
      expect(mockRedis.del).toHaveBeenCalled();
    });
  });
});
