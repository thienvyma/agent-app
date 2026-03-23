# 📏 RULES.md — Luật Chơi Cho AI (v6)

> ⚠️ **BẮT BUỘC**: Mọi AI assistant làm việc trên dự án này PHẢI đọc file này ĐẦU TIÊN.
> File này là LUẬT — không phải gợi ý. Vi phạm = revert.
> Tham khảo: Anthropic best practices + obra/superpowers methodology.

---

## 🔴 WORKFLOW BẮT BUỘC MỖI SESSION (5 bước)

### Bước 1: ĐỌC — 5 file bắt buộc

```
1. PROGRESS.md           → Session trước làm gì, lỗi tồn đọng, bước tiếp
2. architecture_state.json → Module nào xong/chưa, known_issues
3. RULES.md (file này)    → Nhớ luật chơi
4. SESSIONS.md            → Session hiện tại: mấy files, tests gì, CLI gì
5. docs/phases/phase-XX/README.md → Chi tiết + ghi chú thảo luận
```

> Nếu bạn KHÔNG đọc 5 file trên → bạn CHẮC CHẮN sẽ viết code sai, trùng, hoặc thiếu.

### Bước 2: LẬP KẾ HOẠCH + XIN DUYỆT (Human-in-the-Loop)

Trước khi viết dòng code đầu tiên, PHẢI:
1. Liệt kê: Session số mấy? Phase nào?
2. Liệt kê: Cần tạo mấy file? Tên file gì? (tối đa 6)
3. Liệt kê: Tests nào cần viết?
4. Liệt kê: CLI commands nào cần thêm?
5. Kiểm tra: Có phụ thuộc module nào chưa xong không?
6. **TRÌNH BÀY kế hoạch cho owner → CHỜ XÁC NHẬN trước khi code**

> 💡 Theo Anthropic: "Explore → Plan → Code". KHÔNG BAO GIỜ nhảy thẳng vào code.

### Bước 3: CODE — Theo TDD (Red → Green → Refactor)

Quy trình mỗi file:
1. Viết test TRƯỚC (test phải FAIL — Red)
2. Viết code tối thiểu cho test PASS (Green)
3. Refactor code + giữ test pass
4. **Commit ngay sau mỗi file hoàn thành** (không chờ cuối session)

> 💡 Theo obra/superpowers: "Deletes code written before tests". Test-first là bắt buộc.

### Bước 4: KẾT THÚC SESSION — Cập nhật 3 file

```
1. CẬP NHẬT PROGRESS.md:
   - Session vừa làm (files tạo, tests pass/fail)
   - Lỗi tồn đọng (nếu có) — mô tả rõ: file nào, dòng nào, hiện tượng gì
   - Bước tiếp theo rõ ràng (session nào, làm gì)

2. CẬP NHẬT architecture_state.json:
   - Module status: "completed" / "in_progress"
   - known_issues[] nếu có bug
   - current_session: tăng lên

3. COMMIT cuối: `docs: update progress session N`
```

### Bước 5: THAY ĐỔI KIẾN TRÚC — Nếu có

```
- CẬP NHẬT ARCHITECTURE.md + DECISIONS.md + phase README bị ảnh hưởng
```

---

## 🚫 TUYỆT ĐỐI KHÔNG (10 điều cấm)

1. **KHÔNG sửa OpenClaw source** — chỉ giao tiếp qua `IAgentEngine` interface
2. **KHÔNG viết feature ngoài session** — chỉ code module đang focus
3. **KHÔNG sửa file module khác** "tiện tay" — mỗi session = 1 module
4. **KHÔNG để code uncommitted** qua session — commit TRƯỚC khi kết thúc
5. **KHÔNG dùng `any` type** — TypeScript strict mode luôn
6. **KHÔNG hardcode credentials** — dùng environment variables
7. **KHÔNG skip cập nhật docs** — vi phạm rule quan trọng nhất
8. **KHÔNG tạo file trống** "để sau" — mỗi file phải có ít nhất interface/type
9. **KHÔNG xóa/sửa tests đang pass** để "fix" code — sửa CODE cho pass TEST
10. **KHÔNG viết code TRƯỚC test** — TDD bắt buộc (Red → Green → Refactor)

## ✅ BẮT BUỘC (10 điều phải làm)

1. **Test trước, code sau** — viết test → chạy fail → viết code → pass → commit
2. **Interface trước, implementation sau** — define contract rồi mới code
3. **Mỗi file < 300 dòng** — tách ra nếu quá dài
4. **Mọi function phải có error handling + logging** — không silent fail
5. **Mọi function phải có JSDoc** — mô tả purpose, params, return
6. **Commit sau mỗi file hoàn thành** — KHÔNG tích commit cuối session
7. **CLI command cho mọi feature** — thêm vào `ae` CLI framework (Phase 2)
8. **Mỗi session tối đa 6 files mới** — vượt → DỪNG LẠI và hỏi owner
9. **Trình kế hoạch trước khi code** — owner phải xác nhận (Bước 2)
10. **Verify trước khi kết thúc** — chạy tests, kiểm tra CLI, evidence > claims

---

## 🧠 QUY TẮC CHỐNG MẤT CONTEXT (Anthropic best practices)

### File = Bộ nhớ (giữa các sessions):
| File | Vai trò | Khi nào đọc |
|---|---|---|
| `PROGRESS.md` | Bộ nhớ chính | ĐẦU TIÊN mỗi session |
| `architecture_state.json` | Bản đồ module | Đầu session |
| `SESSIONS.md` | Kế hoạch chi tiết | Đầu session |
| `docs/phases/phase-XX/README.md` | Context + ghi chú | Đầu session |
| `DECISIONS.md` | Tại sao quyết định X | Khi cần context thiết kế |
| `ARCHITECTURE.md` | Kiến trúc tổng quan | Khi thay đổi kiến trúc |

### Context management (giữ context window sạch):
- CHỈ ĐỌC files cần thiết cho session hiện tại
- KHÔNG đọc toàn bộ codebase — load progressive (cần gì đọc nấy)
- Đọc theo thứ tự: PROGRESS → architecture_state → SESSIONS → phase README → source

### Khi phát hiện bug:
1. GHI VÀO `PROGRESS.md` → "Lỗi tồn đọng" (file, dòng, hiện tượng, session ảnh hưởng)
2. GHI VÀO `architecture_state.json` → `known_issues[]`

### Khi có quyết định thiết kế mới:
1. GHI VÀO `DECISIONS.md` — quyết định + lý do + alternatives đã cân nhắc
2. GHI VÀO phase README → "Ghi Chú Thảo Luận"

---

## 🔄 QUY TẮC FAIL-FAST (Anthropic: "khi sai 2/3 lần → bắt đầu lại")

1. Nếu fix lỗi **2 lần mà vẫn sai** → DỪNG LẠI
2. Báo owner mô tả vấn đề
3. Bắt đầu lại với approach khác (KHÔNG tiếp tục đào sâu)
4. `git stash` hoặc `git checkout -- .` để quay lại clean state

## 🗣️ QUYỀN NÓI "KHÔNG CHẮC" (Anthropic: "giảm hallucination")

- AI ĐƯỢC PHÉP và KHUYẾN KHÍCH nói: "Tôi không chắc chắn về X"
- KHÔNG bao giờ đoán mò khi không biết → hỏi owner
- Ghi câu hỏi vào phase README "Ghi Chú Thảo Luận"
- Ưu tiên: hỏi trước, làm đúng 1 lần > đoán mò sai 3 lần

---

## 🦸 SUPERPOWERS SKILLS (obra/superpowers — nguyên gốc)

7 skills gốc đã cài tại `.agent/skills/`. AI PHẢI đọc SKILL.md tương ứng khi cần:

| Khi nào | Đọc file |
|---|---|
| Bắt đầu code bất kỳ file nào | `.agent/skills/test-driven-development/SKILL.md` |
| Gặp bug cần debug | `.agent/skills/systematic-debugging/SKILL.md` |
| Trước khi nói "xong" / "pass" | `.agent/skills/verification-before-completion/SKILL.md` |
| Lập kế hoạch implementation | `.agent/skills/writing-plans/SKILL.md` |
| Brainstorm ý tưởng / thiết kế | `.agent/skills/brainstorming/SKILL.md` |
| Thực thi plan theo batch | `.agent/skills/executing-plans/SKILL.md` |
| Review code trước commit | `.agent/skills/requesting-code-review/SKILL.md` |

### Session workflow: xem `.agent/workflows/session.md`

### 3 Iron Laws (từ superpowers):
```
TDD:          "NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST"
VERIFICATION: "NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE"  
DEBUGGING:    "NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST"
```

---

## ✋ VERIFICATION IRON LAW (obra/superpowers)

```
KHÔNG ĐƯỢC TUYÊN BỐ "XONG" KHI CHƯA CÓ BẰNG CHỨNG
```

Trước khi nói "tests pass", "đã fix", "hoàn thành":
1. **CHẠY** lệnh verify (test, build, lint)
2. **ĐỌC** toàn bộ output
3. **XÁC NHẬN** output khớp với claim
4. CHỈ SAU ĐÓ mới tuyên bố kết quả

| Claim | Cần có | KHÔNG đủ |
|---|---|---|
| "Tests pass" | Output: 0 failures | "Chắc là pass" |
| "Build OK" | Exit code 0 | "Linter pass rồi" |
| "Bug fixed" | Test gốc pass | "Đã sửa code" |
| "Session xong" | Checklist ✅ tất cả | "Nghĩ là xong" |

**Red flags — DỪNG LẠI nếu đang dùng từ**: "chắc là", "có lẽ", "nên được", "hình như".

---

## 🔍 SYSTEMATIC DEBUGGING (obra/superpowers 4-phase)

Khi gặp bug, PHẢI theo 4 phase — KHÔNG được nhảy thẳng vào fix:

```
Phase 1: TÌM NGUYÊN NHÂN GỐC
  → Đọc error message, stack trace, logs
  → Tái hiện lỗi (reproduce)
  → Thu hẹp phạm vi (narrow down)

Phase 2: PHÂN TÍCH PATTERN
  → Lỗi xảy ra khi nào? Điều kiện gì?
  → Có pattern chung không?
  → Liên quan đến module nào?

Phase 3: GIẢ THUYẾT & KIỂM TRA
  → Đề xuất 1-2 giả thuyết
  → Test từng giả thuyết
  → Xác nhận root cause

Phase 4: SỬA + VIẾT REGRESSION TEST
  → Viết test tái hiện bug TRƯỚC (phải FAIL)
  → Sửa code (test PASS)
  → Verify: revert fix → test FAIL lại → restore fix → test PASS
```

> 💡 "Random fixes waste time and create new bugs." — KHÔNG bao giờ đoán mò fix.

---

## 🧠 CHỐNG RATIONALIZATION (TDD)

Khi AI muốn skip TDD, bảng này giúp nhận diện rationalization:

| Lý Do Bào Chữa | Sự Thật |
|---|---|
| "Quá đơn giản để test" | Code đơn giản vẫn hỏng. Test mất 30 giây |
| "Viết test sau cũng được" | Test pass ngay = chứng minh không có gì |
| "Đã test thủ công rồi" | Ad-hoc ≠ systematic. Không re-run được |
| "Xóa code phí X giờ" | Sunk cost fallacy. Code không test = nợ kỹ thuật |
| "Giữ code cũ làm reference" | Bạn sẽ "adapt" thay vì viết mới = test-after |
| "Cần explore trước" | OK. Nhưng sau đó XÓA explore, bắt đầu TDD |
| "TDD chậm hơn" | TDD NHANH hơn debugging. Pragmatic = test-first |
| "Code trước test → nhanh hơn" | Viết code trước test? **XÓA code. Bắt đầu lại.** |

---

## 🏗️ Coding Conventions

### TypeScript
- Strict mode: `"strict": true`
- Prefer `interface` over `type` cho object shapes
- Prefer `const` over `let`
- Async/await over raw Promises
- Named exports over default exports
- JSDoc trên mọi function

### File & Folder Naming
- Files: `kebab-case.ts` (e.g. `agent-orchestrator.ts`)
- Interfaces: `PascalCase` prefix `I` (e.g. `IAgentEngine`)
- Types: `PascalCase` (e.g. `AgentConfig`)
- Constants: `UPPER_SNAKE_CASE`
- Functions/methods: `camelCase`
- Test files: `*.test.ts` mirror source structure

### Project Structure
```
src/
├── app/          # Next.js pages + API routes
├── core/         # Business logic (server-side only)
│   ├── adapter/  # IAgentEngine + implementations
│   ├── company/  # Org structure
│   ├── orchestrator/  # Agent lifecycle + health
│   ├── tools/    # Tool registry + permissions
│   ├── tasks/    # Task decomposer + error recovery
│   ├── memory/   # Vector DB + Knowledge Base
│   ├── messaging/     # Message bus + routing
│   ├── triggers/ # External triggers
│   ├── approval/      # HITL approval
│   ├── feedback/      # Self-learning
│   ├── cost/     # Token/budget tracking
│   └── channels/      # Telegram, etc.
├── cli/          # CLI commands (ae agent, ae task, etc.)
├── components/   # React UI components
├── lib/          # Shared utilities
└── types/        # Shared TypeScript types
tests/            # Mirrors src/ structure
```

### Git Commits
```
Format: <type>(<scope>): <description>

Types: chore, feat, fix, test, docs, refactor
Scopes: foundation, scaffold, cli, adapter, company, orchestrator,
        tools, tasks, memory, messaging, triggers, approval,
        api, cost, telegram, ui, feedback
```

---

## 🔌 OpenClaw Integration Rules

- OpenClaw = **separate process** (Gateway port 18789)
- App giao tiếp qua **HTTP REST API** only
- Adapter pattern: `IAgentEngine` → `OpenClawAdapter`
- API thay đổi → chỉ sửa `OpenClawAdapter`, KHÔNG sửa business logic
- Config OpenClaw qua **file config riêng**

### Memory 3-Tier:
- **Tier 1 (OpenClaw)**: MEMORY.md + daily logs + Mem0 plugin (per-agent)
- **Tier 2 (pgvector)**: Company KB, cross-agent search, conversation logs
- **Tier 3 (Redis)**: Session STM, volatile state

## 🖥️ Deployment Rules

- **Local-first**: App chạy trên localhost
- **$0 cost**: Ollama + OpenClaw + PostgreSQL Docker + Redis Docker
- `docker-compose.yml` cho tất cả services
- `.env` cho environment variables
- Cloud-ready: chỉ đổi `.env` + deploy

---

## 📋 CHECKLIST NHANH (Copy vào đầu mỗi session)

```
=== TRƯỚC KHI CODE ===
□ Đã đọc PROGRESS.md
□ Đã đọc architecture_state.json (kiểm tra known_issues)
□ Đã đọc RULES.md
□ Đã đọc SESSIONS.md → Session N
□ Đã đọc docs/phases/phase-XX/README.md
□ Đã liệt kê files cần tạo (≤6)
□ Đã liệt kê tests cần viết
□ Đã liệt kê CLI commands cần thêm
□ Đã trình kế hoạch cho owner → được xác nhận
□ Không có dependency chưa xong blocking session này

=== TRONG KHI CODE (per file) ===
□ Viết test trước (phải FAIL)
□ Viết code tối thiểu (test PASS)
□ Refactor
□ Commit file

=== SAU KHI CODE ===
□ Tất cả tests pass
□ CLI commands hoạt động
□ Self-review: đúng spec? quality OK?
□ Đã cập nhật PROGRESS.md
□ Đã cập nhật architecture_state.json
□ Commit cuối: docs: update progress session N
```
