# Document Index - Agentic Enterprise

> TAT CA docs va cach su dung. AI DOC Day TRUOC khi bat dau bat ky session nao.
> Link voi nhau de tranh roi rac khi lam viec.

---

## Core Documents (BAT BUOC doc moi session)

| File | Muc dich | Khi nao doc |
|---|---|---|
| RULES.md | Luat choi cho AI, workflow bat buoc | DAU TIEN moi session |
| PROGRESS.md | Session truoc lam gi, loi ton dong | Dau session (buoc 1) |
| architecture_state.json | Module nao xong/chua, known_issues | Dau session (buoc 1) |
| SESSIONS.md | Ke hoach 27 sessions, files per session | Dau session (buoc 1) |
| docs/phases/phase-XX/README.md | Chi tiet phase hien tai | Dau session (buoc 1) |

## Architecture Documents (doc khi can context thiet ke)

| File | Muc dich | Khi nao doc |
|---|---|---|
| ARCHITECTURE.md | Kien truc tong quan 8 stages | Khi thay doi kien truc |
| DECISIONS.md | 13 quyet dinh thiet ke (D1-D13) + ly do | Khi can hieu TAI SAO |
| PRD.md | 11 features (F1-F11) + user persona | Khi can doi chieu yeu cau |

## Technical Reference (doc khi code cac phase lien quan)

| File | Muc dich | Phases lien quan |
|---|---|---|
| docs/openclaw-integration.md | OpenClaw API, tools, sessions, memory, config | P3 (interface), P4 (adapter), P7 (lifecycle), P10 (memory) |
| docs/MEMORY_RESEARCH.md | Vector DB comparison, embedding models, RAG patterns | P10 (vector), P11 (conversation), P12 (knowledge) |
| docs/GAP_ANALYSIS.md | 10 gaps da phat hien va da fix | Reference khi review |
| docs/VIBE_CODING_REFERENCE.md | Anthropic best practices + Superpowers methodology | Moi session (workflow) |

## Phase READMEs (26 files)

### Giai Doan A: Nen Tang (P1-2)
| Phase | File | Phu thuoc | Docs lien quan |
|---|---|---|---|
| P1 Foundation | docs/phases/phase-01-foundation/README.md | (none) | VIBE_CODING_REFERENCE.md |
| P2 CLI | docs/phases/phase-02-cli/README.md | P1 | DECISIONS.md (D14: Commander.js) |

### Giai Doan B: Engine (P3-4)
| Phase | File | Phu thuoc | Docs lien quan |
|---|---|---|---|
| P3 Engine Interface | docs/phases/phase-03-engine-interface/README.md | P1 | openclaw-integration.md (Section 8: API) |
| P4 OpenClaw Adapter | docs/phases/phase-04-openclaw-adapter/README.md | P3 | openclaw-integration.md (Section 2-8) |

### Giai Doan C: Nhan Su (P5-9)
| Phase | File | Phu thuoc | Docs lien quan |
|---|---|---|---|
| P5 DB Schema | docs/phases/phase-05-db-schema/README.md | P1 | PRD.md (F1), DECISIONS.md (D7) |
| P6 Company Manager | docs/phases/phase-06-company-manager/README.md | P5 | PRD.md (F1) |
| P7 Agent Lifecycle | docs/phases/phase-07-agent-lifecycle/README.md | P3,P5,P6 | openclaw-integration.md (Section 4,7), DECISIONS.md (D2) |
| P8 Tools Security | docs/phases/phase-08-tools-security/README.md | P5,P6 | PRD.md (F1,F11), GAP_ANALYSIS.md (Gap 1) |
| P9 Task Engine | docs/phases/phase-09-task-engine/README.md | P3,P6,P7 | DECISIONS.md (D6) |

### Giai Doan D: Tri Nho (P10-12)
| Phase | File | Phu thuoc | Docs lien quan |
|---|---|---|---|
| P10 Vector Memory | docs/phases/phase-10-vector-memory/README.md | P1,P5 | MEMORY_RESEARCH.md, openclaw-integration.md (Section 6), DECISIONS.md (D12) |
| P11 Conversation Memory | docs/phases/phase-11-conversation-mem/README.md | P10 | MEMORY_RESEARCH.md |
| P12 Knowledge Engine | docs/phases/phase-12-knowledge-engine/README.md | P10,P11 | MEMORY_RESEARCH.md |

### Giai Doan E: Giao Tiep (P13-15)
| Phase | File | Phu thuoc | Docs lien quan |
|---|---|---|---|
| P13 Messaging | docs/phases/phase-13-messaging/README.md | P5,P6 | DECISIONS.md (D3) |
| P14 Triggers | docs/phases/phase-14-triggers/README.md | P13 | DECISIONS.md (D2) |
| P15 Approval | docs/phases/phase-15-approval/README.md | P5,P13 | DECISIONS.md (D4), GAP_ANALYSIS.md (Gap 5) |

### Giai Doan F: Ket Noi (P16-20)
| Phase | File | Phu thuoc | Docs lien quan |
|---|---|---|---|
| P16 Core API | docs/phases/phase-16-core-api/README.md | P5-P7 | |
| P17 Extended API | docs/phases/phase-17-extended-api/README.md | P16,P8-P15 | |
| P18 Cost Tracking | docs/phases/phase-18-cost-tracking/README.md | P7,P8 | DECISIONS.md (D9) |
| P19 Realtime | docs/phases/phase-19-realtime/README.md | P1 | |
| P20 Telegram | docs/phases/phase-20-telegram/README.md | P7,P9,P13,P15,P18 | PRD.md (F8), DECISIONS.md (D4), openclaw-integration.md (Section 2: Channel Manager) |

### Giai Doan G: Dashboard (P21-24)
| Phase | File | Phu thuoc | Docs lien quan |
|---|---|---|---|
| P21 Design System | docs/phases/phase-21-design-system/README.md | P1 | |
| P22 UI Components | docs/phases/phase-22-ui-components/README.md | P21 | |
| P23 Core Pages | docs/phases/phase-23-core-pages/README.md | P16-17,P21-22 | |
| P24 Data Pages | docs/phases/phase-24-data-pages/README.md | P19,P16-17,P22 | |

### Giai Doan H: Hoan Thien (P25-26)
| Phase | File | Phu thuoc | Docs lien quan |
|---|---|---|---|
| P25 E2E Testing | docs/phases/phase-25-e2e-testing/README.md | ALL | |
| P26 Self-Learning | docs/phases/phase-26-self-learning/README.md | P10-12,P15 | DECISIONS.md (D5), MEMORY_RESEARCH.md |

## Cross-Reference Map

`
RULES.md (entry point)
  |-- reads -> PROGRESS.md, architecture_state.json, SESSIONS.md, phase README
  |
  +-- ARCHITECTURE.md
  |     |-- references -> SESSIONS.md, DECISIONS.md, openclaw-integration.md
  |     +-- maps to -> 26 phase READMEs
  |
  +-- DECISIONS.md (13 decisions)
  |     |-- D1 -> openclaw-integration.md (IAgentEngine)
  |     |-- D2 -> P7 (CEO always-on), P14 (triggers)
  |     |-- D3 -> P13 (3 communication patterns)
  |     |-- D4 -> P15 (HITL), P20 (Telegram approval)
  |     |-- D5 -> P26 (Self-Learning)
  |     |-- D7 -> P5 (PostgreSQL + Prisma)
  |     |-- D12 -> P10 (3-tier memory), MEMORY_RESEARCH.md
  |
  +-- PRD.md (11 features)
  |     |-- F1 -> P5 (schema), P6 (CRUD), P8 (tools)
  |     |-- F2 -> P7 (lifecycle)
  |     |-- F3 -> P9 (task decomposition)
  |     |-- F4 -> P15 (approval)
  |     |-- F5 -> P10-12 (memory)
  |     |-- F6 -> P13-14 (messaging, triggers)
  |     |-- F7 -> P21-24 (dashboard)
  |     |-- F8 -> P20 (telegram)
  |     |-- F9 -> P2 (CLI)
  |     |-- F10 -> P26 (feedback loop)
  |     |-- F11 -> P8 (audit), P18 (cost)
  |
  +-- Technical References
        |-- openclaw-integration.md -> P3, P4, P7, P10, P20
        |-- MEMORY_RESEARCH.md -> P10, P11, P12, P26
        |-- GAP_ANALYSIS.md -> (reference only, resolved)
        |-- VIBE_CODING_REFERENCE.md -> moi session
`

## Cach Su Dung (cho AI)

### Truoc moi session:
1. Doc RULES.md (5 buoc bat buoc)
2. Doc PROGRESS.md (session truoc)
3. Doc SESSIONS.md (session hien tai)
4. Doc phase README tuong ung
5. Doc "Docs lien quan" trong bang phase o tren

### Khi gap van de thiet ke:
-> Doc DECISIONS.md (tim decision lien quan)
-> Doc ARCHITECTURE.md (kien truc tong quan)

### Khi code engine/adapter:
-> Doc openclaw-integration.md (API, tools, sessions)

### Khi code memory:
-> Doc MEMORY_RESEARCH.md (tech comparison, best practices)

### Khi review:
-> Doc GAP_ANALYSIS.md (gaps da fix, dam bao khong quay lai)
