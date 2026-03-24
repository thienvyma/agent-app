/**
 * DocumentIngester — ingest documents into VectorStore.
 *
 * Reads files, chunks text with overlap, embeds each chunk,
 * and stores into pgvector for semantic search.
 *
 * Supported formats: .md, .txt, .csv
 * (.pdf support planned for future phase)
 *
 * @module core/memory/document-ingester
 */

import { readFile } from "fs/promises";
import { extname } from "path";
import type { VectorStore } from "@/core/memory/vector-store";
import type { EmbeddingService } from "@/core/memory/embedding-service";
import { VectorType } from "@/types/memory";

/** Metadata for ingested documents */
interface DocMetadata {
  title?: string;
  author?: string;
  tags?: string[];
}

/** Result of document ingestion */
export interface IngestResult {
  source: string;
  chunksCreated: number;
  vectorIds: string[];
}

/** Supported file extensions */
const SUPPORTED_EXTENSIONS = new Set([".md", ".txt", ".csv"]);

/**
 * Ingests documents into VectorStore for semantic search.
 */
export class DocumentIngester {
  /** Default chunk size in words */
  private static readonly DEFAULT_CHUNK_SIZE = 500;
  /** Default overlap in words */
  private static readonly DEFAULT_OVERLAP = 50;

  constructor(
    private readonly vectorStore: VectorStore,
    private readonly embedService: EmbeddingService
  ) {}

  /**
   * Ingest a file into the knowledge base.
   *
   * @param filePath - Path to file (.md, .txt, .csv)
   * @param metadata - Optional document metadata
   * @returns IngestResult with chunk count and vector IDs
   * @throws Error for unsupported file types
   */
  async ingest(
    filePath: string,
    metadata?: DocMetadata
  ): Promise<IngestResult> {
    const ext = extname(filePath).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(ext)) {
      throw new Error(
        `Unsupported file type: ${ext}. Supported: ${[...SUPPORTED_EXTENSIONS].join(", ")}`
      );
    }

    const content = await readFile(filePath, "utf-8");
    return this.ingestText(content, filePath, metadata);
  }

  /**
   * Ingest raw text into the knowledge base.
   *
   * @param text - Text content to ingest
   * @param source - Source identifier (file path or description)
   * @param metadata - Optional document metadata
   * @returns IngestResult with chunk count and vector IDs
   */
  async ingestText(
    text: string,
    source: string,
    metadata?: DocMetadata
  ): Promise<IngestResult> {
    const chunks = this.chunkText(
      text,
      DocumentIngester.DEFAULT_CHUNK_SIZE,
      DocumentIngester.DEFAULT_OVERLAP
    );

    const vectorIds: string[] = [];

    for (const chunk of chunks) {
      const embedding = await this.embedService.embed(chunk);
      const id = await this.vectorStore.store(chunk, embedding, {
        type: VectorType.DOCUMENT,
        source,
        timestamp: new Date(),
        ...metadata,
      });
      vectorIds.push(id);
    }

    return {
      source,
      chunksCreated: chunks.length,
      vectorIds,
    };
  }

  /**
   * Split text into overlapping chunks by word count.
   *
   * @param text - Text to chunk
   * @param chunkSize - Words per chunk
   * @param overlap - Words of overlap between chunks
   * @returns Array of text chunks
   */
  chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const words = text.split(/\s+/).filter(Boolean);

    if (words.length <= chunkSize) {
      return [text.trim()];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < words.length) {
      const end = Math.min(start + chunkSize, words.length);
      chunks.push(words.slice(start, end).join(" "));
      start += chunkSize - overlap;

      // Avoid infinite loop if overlap >= chunkSize
      if (start <= chunks.length - 1 && start + chunkSize >= words.length) {
        break;
      }
    }

    // Ensure last chunk captures remaining words
    const lastEnd = words.length;
    const lastStart = Math.max(0, lastEnd - chunkSize);
    const lastChunk = words.slice(lastStart, lastEnd).join(" ");
    if (chunks[chunks.length - 1] !== lastChunk) {
      chunks.push(lastChunk);
    }

    return chunks;
  }
}
