/**
 * Memory type definitions for the 3-tier memory system.
 *
 * Tier 1: OpenClaw native (per-agent, managed by OpenClaw)
 * Tier 2: pgvector (company-wide, long-term knowledge)
 * Tier 3: Redis STM (session, volatile, real-time)
 *
 * @module types/memory
 */

/** Type of vector content stored in pgvector */
export enum VectorType {
  CONVERSATION = "CONVERSATION",
  DOCUMENT = "DOCUMENT",
  CORRECTION = "CORRECTION",
  RULE = "RULE",
  KNOWLEDGE = "KNOWLEDGE",
}

/** Metadata attached to each vector */
export interface VectorMetadata {
  type: VectorType;
  agentId?: string;
  taskId?: string;
  source: string; // "conversation", "document", "correction"
  timestamp: Date;
}

/** Result from vector similarity search */
export interface VectorResult {
  id: string;
  content: string;
  score: number; // cosine similarity 0-1
  metadata: VectorMetadata;
}

/** Filter for vector search */
export interface VectorFilter {
  type?: VectorType;
  agentId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

/** Agent session state (Redis Tier 3) */
export interface SessionState {
  currentTaskId?: string;
  conversationHistory: string[];
  lastActivity: Date;
  tokenCount: number;
}

/** Task progress cache (Redis Tier 3) */
export interface TaskProgress {
  taskId: string;
  status: string;
  percentComplete: number;
  lastUpdate: Date;
}

// ================ Phase 12: Knowledge Engine ================

/** LightRAG query modes for dual-level retrieval */
export type LightRAGQueryMode = "naive" | "local" | "global" | "hybrid";

/** Result from LightRAG graph-enhanced search */
export interface LightRAGResult {
  id: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}

/** Structured context built by ContextBuilder for system prompt injection */
export interface TaskContext {
  /** Agent SOP/role description */
  agentSop: string;
  /** Graph-enhanced knowledge from LightRAG */
  knowledgeResults: LightRAGResult[];
  /** Past conversations from VectorStore */
  pastExperience: VectorResult[];
  /** Learned rules from corrections */
  corrections: VectorResult[];
  /** Whether LightRAG was available */
  lightragAvailable: boolean;
}
