/**
 * EmbeddingService — generate vector embeddings via Ollama API.
 *
 * Uses LAN Ollama server for embedding text into vectors.
 * Default model: nomic-embed-text (768 dimensions).
 *
 * @module core/memory/embedding-service
 */

/** Supported embedding models and their dimensions */
const MODEL_DIMENSIONS: Record<string, number> = {
  "nomic-embed-text": 768,
  "bge-m3": 1024,
  "all-minilm": 384,
};

/**
 * Service for generating text embeddings via Ollama.
 */
export class EmbeddingService {
  private readonly model: string;

  constructor(
    private readonly ollamaUrl: string = "http://192.168.1.35:8080",
    model: string = "nomic-embed-text"
  ) {
    this.model = model;
  }

  /**
   * Embed a single text string into a vector.
   *
   * @param text - Text to embed
   * @returns Embedding vector (number[])
   * @throws Error if Ollama is not reachable
   */
  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${this.ollamaUrl}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        prompt: text,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Ollama embedding failed: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as { embedding: number[] };
    return data.embedding;
  }

  /**
   * Embed multiple texts in batch.
   *
   * @param texts - Array of texts to embed
   * @returns Array of embedding vectors
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      const embedding = await this.embed(text);
      results.push(embedding);
    }
    return results;
  }

  /**
   * Get the dimension of the current embedding model.
   *
   * @returns Number of dimensions (e.g., 768 for nomic-embed-text)
   */
  getModelDimension(): number {
    return MODEL_DIMENSIONS[this.model] ?? 768;
  }
}
