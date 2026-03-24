/**
 * VectorStore — pgvector CRUD operations for Tier 2 memory.
 *
 * Uses raw SQL queries via Prisma.$queryRaw since Prisma
 * doesn't natively support the pgvector `vector` type.
 *
 * @module core/memory/vector-store
 */

import type { PrismaClient } from "@prisma/client";
import type { VectorMetadata, VectorResult, VectorFilter } from "@/types/memory";

/**
 * Store and search vectors using PostgreSQL pgvector extension.
 */
export class VectorStore {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Store a vector with content and metadata.
   *
   * @param content - Text content
   * @param embedding - Vector embedding (number[])
   * @param metadata - Associated metadata
   * @returns Vector ID
   */
  async store(
    content: string,
    embedding: number[],
    metadata: VectorMetadata
  ): Promise<string> {
    const vectorStr = `[${embedding.join(",")}]`;
    const result = await this.db.$queryRaw<Array<{ id: string }>>`
      INSERT INTO vectors (id, content, embedding, type, source_id, metadata, created_at)
      VALUES (
        gen_random_uuid(),
        ${content},
        ${vectorStr}::vector,
        ${metadata.type},
        ${metadata.agentId ?? null},
        ${JSON.stringify(metadata)}::jsonb,
        NOW()
      )
      RETURNING id
    `;

    return result[0].id;
  }

  /**
   * Search vectors by cosine similarity.
   *
   * @param queryEmbedding - Query vector
   * @param limit - Max results to return
   * @param filter - Optional filters (type, agentId, date range)
   * @returns Sorted results with similarity scores
   */
  async search(
    queryEmbedding: number[],
    limit: number = 10,
    filter?: VectorFilter
  ): Promise<VectorResult[]> {
    const vectorStr = `[${queryEmbedding.join(",")}]`;

    // Build WHERE clauses
    const conditions: string[] = [];
    if (filter?.type) conditions.push(`type = '${filter.type}'`);
    if (filter?.agentId) conditions.push(`source_id = '${filter.agentId}'`);
    if (filter?.dateFrom) conditions.push(`created_at >= '${filter.dateFrom.toISOString()}'`);
    if (filter?.dateTo) conditions.push(`created_at <= '${filter.dateTo.toISOString()}'`);

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const results = await this.db.$queryRaw<Array<{
      id: string;
      content: string;
      score: number;
      metadata: string;
    }>>`
      SELECT
        id,
        content,
        1 - (embedding <=> ${vectorStr}::vector) as score,
        metadata::text
      FROM vectors
      ${whereClause ? `WHERE ${conditions.join(" AND ")}` : ""}
      ORDER BY embedding <=> ${vectorStr}::vector
      LIMIT ${limit}
    `;

    return results.map((r) => ({
      id: r.id,
      content: r.content,
      score: r.score,
      metadata: typeof r.metadata === "string"
        ? JSON.parse(r.metadata) as VectorMetadata
        : r.metadata as unknown as VectorMetadata,
    }));
  }

  /**
   * Delete a vector by ID.
   */
  async delete(vectorId: string): Promise<void> {
    await this.db.$executeRaw`
      DELETE FROM vectors WHERE id = ${vectorId}
    `;
  }

  /**
   * Update vector metadata.
   */
  async update(
    vectorId: string,
    metadata: Partial<VectorMetadata>
  ): Promise<void> {
    await this.db.$executeRaw`
      UPDATE vectors
      SET metadata = metadata || ${JSON.stringify(metadata)}::jsonb
      WHERE id = ${vectorId}
    `;
  }
}
