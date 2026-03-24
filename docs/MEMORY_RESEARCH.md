# 🧠 Memory Research — Giải Pháp Hiệu Quả Nhất 2025

> Research từ 3 nguồn: Vector DB comparison, AI agent memory frameworks, RAG vs Agentic Memory best practices.

---

## 1. Vector Database — Chọn Tech Nào?

### So Sánh Top 3

| Tiêu chí | pgvector | Qdrant | Chroma |
|---|---|---|---|
| **Ngôn ngữ** | PostgreSQL extension (C) | Rust | Python |
| **Điểm mạnh** | Cùng DB với relational data | Performance + filtering | Dev-friendly |
| **Scale** | Tốt (50M+ vectors với pgvectorscale) | Rất tốt (native sharding) | Yếu (< 10M vectors) |
| **Hybrid search** | ✅ (keyword + vector cùng DB) | ✅ (payload filtering) | ❌ Hạn chế |
| **Ops complexity** | Thấp (đã có PostgreSQL) | Trung bình (thêm 1 service) | Thấp (embed in-app) |
| **Production-ready** | ✅ (OpenAI, Supabase dùng) | ✅ (enterprise-grade) | ⚠️ Chủ yếu prototyping |
| **Chi phí thêm** | $0 (extension miễn phí) | Thêm RAM/CPU cho service | $0 (embed) |

### 🏆 Đề xuất: **pgvector** (HNSW index)

**Lý do**:
1. **Dự án đã dùng PostgreSQL** → không thêm service mới vào Docker Compose
2. **Relational + vector cùng 1 query** → join agent metadata với vector search
3. **pgvectorscale** extension → performance ngang Qdrant cho dataset < 50M vectors
4. **Giảm operational complexity** → 1 DB quản lý tất cả
5. **Prisma compatible** (raw SQL cho vector ops)

---

## 2. AI Agent Memory Frameworks — Chuyên Gia Dùng Gì?

### Top 3 Frameworks

#### Mem0 — "Production-Ready Memory Layer" ⭐
```
Kiến trúc: Multi-store (vector search + graph relationships + key-value)
Ưu: 26% chính xác hơn OpenAI native memory, latency thấp
Phù hợp: Personalized chatbots, recommendation, broad memory layer
GitHub: 25k+ stars
```

#### Cognee — "Knowledge Graph Memory"
```
Kiến trúc: Hybrid (vector search + graph DB) với ECL pipeline
Ưu: Complex reasoning, relationship-based data, 28+ data sources
Phù hợp: Research assistants, diagnostic systems, multi-hop reasoning
```

#### Letta (formerly MemGPT) — "OS-Inspired Memory"
```
Kiến trúc: Tiered memory (Core = always in context, Archival = long-term)
Ưu: Self-editing memory (agent tự quyết nhớ/quên), unlimited memory
Phù hợp: Long-running conversational agents, support copilots
```

### So Sánh Cho Dự Án Chúng Ta

| Tiêu chí | Mem0 | Cognee | Letta |
|---|---|---|---|
| **Multi-agent company** | ✅ Tốt | 🟡 Phức tạp | ✅ Tốt |
| **Self-learning** | ✅ Có | ✅ Rất tốt | ✅ Có |
| **Node.js integration** | ✅ npm package | ⚠️ Chủ yếu Python | ⚠️ Chủ yếu Python |
| **Self-hosted** | ✅ Open-source | ✅ Open-source | ✅ Open-source |
| **Thêm dependency** | 🟡 Thêm service | 🟡 Thêm service | 🟡 Thêm service |
| **Complexity** | Thấp | Cao | Trung bình |

---

## 3. RAG vs Agentic Memory — Best Practice 2025

### Khác Biệt Cốt Lõi

| | RAG Truyền Thống | Agentic Memory |
|---|---|---|
| **Read/Write** | Read-only | Read + Write (tự cập nhật) |
| **Persistence** | Stateless mỗi query | Persistent across sessions |
| **Learning** | Không học | Học từ interactions |
| **Temporal** | Không biết thời gian | Biết cái nào mới/cũ |
| **Error rate** | Giảm hallucination 20-30% | Giảm nhiều hơn + tự sửa |

### Multi-Tiered Memory Architecture (Expert Consensus 2025)

```
┌──────────────────────────────────────┐
│ SHORT-TERM MEMORY (STM)              │
│ Redis/In-memory — session context    │
│ → Volatile, mất khi session end      │
│ → Dùng cho: conversation hiện tại    │
├──────────────────────────────────────┤
│ EPISODIC MEMORY                      │
│ Vector DB (pgvector) — experiences   │
│ → Mọi interaction đã embed           │
│ → Dùng cho: "nhớ lại conversation X" │
├──────────────────────────────────────┤
│ SEMANTIC MEMORY                      │
│ Knowledge Base — facts & documents   │
│ → Tài liệu công ty, SOP, bảng giá   │
│ → Dùng cho: "giá vật tư loại X?"     │
├──────────────────────────────────────┤
│ PROCEDURAL MEMORY                    │
│ CorrectionLog — learned rules        │
│ → Rules rút ra từ corrections        │
│ → Dùng cho: "lần trước sếp bảo..."   │
└──────────────────────────────────────┘
```

### Best Practices Cần Áp Dụng

1. **Memory-First**: Agent query memory TRƯỚC, dùng RAG nếu cần
2. **Read-Write Memory**: Agent tự tạo/sửa/xóa memory entries
3. **Ingestion Guard**: PII redaction, toxicity filtering trước khi lưu
4. **Adaptive Decay**: Tự "quên" memory cũ/ít dùng → tiết kiệm storage
5. **Hybrid Retrieval**: Keyword search + Vector search cùng lúc
6. **Context Builder**: Build context đúng mức — không quá nhiều, không quá ít

---

## 4. Đề Xuất Cuối Cùng Cho Dự Án

### Phương án A: Tự Build Memory (Recommended ⭐)

```
VectorStore: pgvector (PostgreSQL extension)
Embedding: Ollama local model (nomic-embed-text hoặc bge-m3)
STM: Redis (đã có cho BullMQ)
Memory Types: Episodic + Semantic + Procedural (4-tier)
Hybrid Search: keyword (PostgreSQL tsvector) + vector (pgvector)
```

**Ưu**: Không thêm dependency, toàn bộ trong PostgreSQL + Redis
**Nhược**: Phải tự code memory lifecycle (formation, evolution, retrieval)

### Phương án B: Tích hợp Mem0

```
Cài mem0 npm package → làm memory backend
Wrap qua MemoryStore interface (giống pattern IAgentEngine)
```

**Ưu**: Production-ready, đã test tốt, ít code hơn
**Nhược**: Thêm dependency, phụ thuộc bên thứ 3

### Phương án C: Hybrid (A + B)

```
Phase 4: Tự build pgvector cơ bản (A) → chạy được
Phase 8+: Tích hợp Mem0 hoặc Cognee nếu cần nâng cao
```

**Ưu**: Bắt đầu nhanh, upgrade sau
**Nhược**: Có thể phải refactor

---

### 🏆 Khuyến nghị: **Phương án A (Tự Build) + 4-Tier Memory**

**Lý do**:
1. Giữ đúng triết lý "ít dependency, dễ bảo trì"
2. pgvector + Redis đã có sẵn trong stack
3. Kiểm soát hoàn toàn memory lifecycle
4. Tự build = hiểu sâu = dễ debug và customize
5. Nếu cần nâng cấp → tích hợp Mem0/Cognee qua interface sau

**4-Tier Memory trong dự án**:

| Tier | Storage | Module | Khi nào dùng |
|---|---|---|---|
| STM | Redis | `ShortTermMemory` | Session hiện tại |
| Episodic | pgvector | `ConversationLogger` | Nhớ tương tác cũ |
| Semantic | pgvector | `KnowledgeBase` | Tài liệu, facts |
| Procedural | pgvector + DB | `CorrectionLog` | Rules từ corrections |

---

> [!NOTE]
> **Quyết định cuối cùng (D12)**: Áp dụng **3-tier** thay vì 4-tier ở trên.
> - **Tier 1: OpenClaw native** (MEMORY.md + Mem0 plugin) — per-agent, tự quản lý
> - **Tier 2: pgvector** — company-wide (Episodic + Semantic + Procedural gộp)
> - **Tier 3: Redis** — session STM
> 
> Lý do: OpenClaw đã có memory system tốt cho per-agent → không cần rebuild. Xem DECISIONS.md → D12.

> [!IMPORTANT]
> **Cập nhật (D15)**: Phase 12 sẽ dùng **LightRAG** (graph-enhanced RAG) thay vì KnowledgeBase tự build.
> - LightRAG kết hợp vector search + knowledge graph (entity extraction + relationships)
> - Dual-level retrieval: granular (entity) + thematic (topic)
> - PostgreSQL backend — dùng chung DB, không thêm Neo4j
> - Chạy như Python Docker service, app giao tiếp qua HTTP
> - Xem DECISIONS.md → D15
