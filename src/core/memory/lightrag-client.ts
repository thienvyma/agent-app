/**
 * LightRAGClient — HTTP bridge to LightRAG Python service.
 *
 * LightRAG provides graph-enhanced RAG with dual-level retrieval:
 * - Local: granular entity-level search
 * - Global: thematic topic-level search
 * - Hybrid: both combined (recommended)
 *
 * @module core/memory/lightrag-client
 */

import type { LightRAGResult, LightRAGQueryMode } from "@/types/memory";

/** Default timeout for LightRAG requests (ms) */
const DEFAULT_TIMEOUT = 10_000;

/**
 * HTTP client for LightRAG Python service.
 * Communicates via REST API on port 9621.
 */
export class LightRAGClient {
  private readonly baseUrl: string;
  private readonly timeout: number;

  /**
   * @param baseUrl - LightRAG service URL (default: http://localhost:9621)
   * @param timeout - Request timeout in ms (default: 10000)
   */
  constructor(
    baseUrl: string = "http://localhost:9621",
    timeout: number = DEFAULT_TIMEOUT
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // strip trailing slash
    this.timeout = timeout;
  }

  /**
   * Check if LightRAG service is healthy.
   *
   * @returns true if service responds, false otherwise
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(this.timeout),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Insert text document into LightRAG for graph indexing.
   *
   * @param text - Document text to index
   * @param metadata - Optional metadata (source, agentId, etc.)
   * @throws Error if service returns non-OK response
   */
  async insert(
    text: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/documents/text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, metadata }),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new Error(
        `LightRAG insert failed: ${response.status} ${response.statusText}`
      );
    }
  }

  /**
   * Query LightRAG with dual-level retrieval.
   *
   * @param question - Natural language query
   * @param mode - Retrieval mode: naive, local, global, or hybrid
   * @returns Array of results (empty on connection error for graceful degradation)
   */
  async query(
    question: string,
    mode: LightRAGQueryMode = "hybrid"
  ): Promise<LightRAGResult[]> {
    try {
      const response = await fetch(`${this.baseUrl}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: question, mode }),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        return [];
      }

      const data = (await response.json()) as { response: string };

      // LightRAG returns a single response string — wrap as result
      if (data.response) {
        return [
          {
            id: `lr-${Date.now()}`,
            content: data.response,
            score: 1.0,
          },
        ];
      }

      return [];
    } catch {
      // Graceful degradation: return empty on connection error
      return [];
    }
  }

  /**
   * Delete a document from LightRAG by ID.
   *
   * @param docId - Document ID to delete
   */
  async deleteDocument(docId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/documents/${docId}`, {
      method: "DELETE",
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new Error(
        `LightRAG delete failed: ${response.status} ${response.statusText}`
      );
    }
  }
}
