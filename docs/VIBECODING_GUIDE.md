# 🚀 Vibecoding Methodology — Complete Guide
> Hướng dẫn chi tiết cách tổ chức dự án để AI coding assistant làm việc hiệu quả nhất.
> Rút ra từ dự án Agentic Enterprise (9 sessions, 75+ tests, 0 bug).
> **Sources**: Anthropic Claude Code Best Practices + obra/superpowers methodology (14 skills).

---

## 1. Triết Lý Cốt Lõi

### 1.1 Vibecoding là gì?
**Con người** = Kiến trúc sư + Reviewer + Quyết định. **AI** = Kỹ sư + Coder + Tester.
- Con người **explore → plan → approve**
- AI **code → test → commit → report**
- Không ai đi trước — phải đồng bộ qua **tài liệu**

### 1.2 Tại sao cần tài liệu?
AI assistant **mất toàn bộ context** giữa các session. Tài liệu = **bộ nhớ ngoài** — mỗi session AI đọc lại và tiếp tục đúng chỗ. Không có tài liệu = mỗi session bắt đầu từ 0.

### 1.3 Ba Luật Sắt (Three Iron Laws — từ obra/superpowers)

| # | Iron Law | Ý nghĩa |
|---|---|---|
| 1 | **TDD** | "NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST" |
| 2 | **VERIFICATION** | "NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE" |
| 3 | **DEBUGGING** | "NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST" |

### 1.4 Nguồn gốc methodology
- **Anthropic**: "Explore → Plan → Code → Commit" (11 best practices)
- **obra/superpowers**: 14 skills + TDD-first + verification-before-completion
- **Custom**: Session workflow, RULES.md, PROGRESS tracking

---

## 2. Cấu Trúc Tài Liệu Bắt Buộc (10 Files)

### 2.1 Nhóm Core — BẮT BUỘC đọc mỗi session

| # | File | Vai trò | AI đọc khi nào |
|---|---|---|---|
| 1 | `RULES.md` | **Luật chơi** — workflow 5 bước, 10 cấm, 10 bắt buộc, checklist | ĐẦU TIÊN |
| 2 | `PROGRESS.md` | **Nhật ký** — session trước, lỗi tồn đọng, bước tiếp | Sau RULES |
| 3 | `architecture_state.json` | **Trạng thái máy** — module nào xong/chưa, known_issues | Sau PROGRESS |
| 4 | `SESSIONS.md` | **Bản đồ** — N phases/M sessions, files per session | Sau architecture |
| 5 | `docs/phases/phase-XX/README.md` | **Spec chi tiết** — files, methods, tests, edge cases | Cuối cùng |
| 6 | `docs/INDEX.md` | **Cross-reference** — phase nào cần đọc doc nào thêm | Khi cần |

### 2.2 Nhóm Architecture — Đọc khi cần context

| # | File | Vai trò |
|---|---|---|
| 7 | `ARCHITECTURE.md` | Sơ đồ kiến trúc tổng quan (5 tầng + CLI) |
| 8 | `DECISIONS.md` | Sổ quyết định thiết kế (D1-DN) + lý do + alternatives |
| 9 | `PRD.md` | Product Requirements Document (F1-FN) |

### 2.3 Nhóm Reference — Đọc khi code phase liên quan

| # | File | Khi nào |
|---|---|---|
| 10 | `docs/*.md` | Technical reference (API docs, memory research, etc.) |

---

## 3. Chi Tiết Từng File — Cách Tạo

### 3.1 RULES.md — "Luật Chơi Cho AI"

**Đây là file quan trọng nhất.** AI đọc đầu tiên mỗi session. Nội dung:

```markdown
# RULES.md

## WORKFLOW BẮT BUỘC MỖI SESSION (5 bước)
### Bước 1: ĐỌC — N file bắt buộc
### Bước 2: LẬP KẾ HOẠCH + XIN DUYỆT (Human-in-the-Loop)
### Bước 3: CODE — Theo TDD (Red → Green → Refactor)
### Bước 4: KẾT THÚC SESSION — Cập nhật docs
### Bước 5: THAY ĐỔI KIẾN TRÚC (nếu có)

## TUYỆT ĐỐI KHÔNG (10 điều cấm)
1. Không viết code trước test
2. Không sửa module ngoài session hiện tại
3. Không dùng `any` type
4. Không skip cập nhật docs
5. Không tạo file trống
6. Không để code uncommitted qua session
7. Không hardcode credentials
8. Không sửa tests đang pass để "fix" code
9. Không viết feature ngoài session scope
10. Không sửa dependency source code

## BẮT BUỘC (10 điều phải làm)
1. Test trước, code sau
2. Interface trước, implementation sau
3. Mỗi file < 300 dòng
4. JSDoc trên mọi function
5. Commit sau mỗi file
6. CLI command cho mọi feature
7. Mỗi session tối đa 6 files mới
8. Trình kế hoạch trước khi code
9. Verify trước khi kết thúc
10. Error handling + logging cho mọi function

## QUY TẮC FAIL-FAST
- Fix lỗi 2 lần sai → DỪNG → approach khác
- AI ĐƯỢC nói "không chắc" → tốt hơn đoán mò

## CODING CONVENTIONS
- TypeScript strict, kebab-case files, PascalCase interfaces
- Git: <type>(<scope>): <description>

## CHECKLIST NHANH (copy vào mỗi session)
□ Đọc 6 file bắt buộc
□ Trình plan → owner OK
□ TDD: test→fail→code→pass→commit
□ Cập nhật PROGRESS.md + architecture_state.json
□ Commit cuối: docs: update progress session N
```

### 3.2 SESSIONS.md — "Bản Đồ Sessions"

**Mục đích**: Chia dự án thành N sessions nhỏ, mỗi session có scope cụ thể.

**Nguyên tắc chia session**:
- Mỗi session = **1 module** (không trộn lẫn)
- Tối đa **4-6 files mới** per session
- Liệt kê cụ thể: **files + tests + CLI commands + commit message**
- Gom theo **Giai đoạn** (A: Nền tảng → B: Engine → C: Business → ...)
- Ghi rõ **dependencies** giữa sessions

```markdown
# SESSIONS.md — 26 Phases / 27 Sessions

## Giai Đoạn A: Nền Tảng (P1-2, S0-S2)

### Phase 1: Foundation (S0-S1)
**Session 0** — Foundation docs, rules, skills.
**Session 1** — Scaffold + Docker + DB init.
- Files: package.json, docker-compose.yml, tsconfig.json (≤6)
- Test: `npm run dev` OK, `docker compose up` OK
- CLI: (chưa có)
- Commit: `chore(scaffold): Next.js + Docker + Prisma`

### Phase 2: CLI (S2)
**Session 2** — CLI framework + status command.
- Files: src/cli/index.ts, commands/status.ts, utils/output.ts
- Test: `ae status` trả JSON (7/7 pass)
- CLI: `ae status`, `ae --help`
- Commit: `feat(cli): ae CLI framework + ae status`

## Giai Đoạn B: Engine (P3-4, S3-S4)
### Phase 3: Engine Interface (S3)
...
```

### 3.3 PROGRESS.md — "Nhật Ký Tiến Trình"

**Format**: Bảng tracking + session hiện tại + lỗi tồn đọng.

```markdown
# PROGRESS.md

## Session Hiện Tại: Session 5 (DB Schema)
**Status**: ✅ Completed
**Ngày**: 2026-03-24

## Tổng Quan
| Session | Status | Module | Commits |
|---|---|---|---|
| S0 | ✅ | Foundation | 24 |
| S1 | ✅ | Scaffold | 1 |
| ...

## Lỗi Tồn Đọng
(nếu có: file nào, dòng nào, hiện tượng gì, session nào ảnh hưởng)

## Bước Tiếp Theo
Session 6: Company Manager — CRUD + Hierarchy
```

### 3.4 architecture_state.json — "Trạng Thái Máy"

```json
{
  "project": "my-project",
  "version": "0.0.0",
  "phase": 6,
  "current_session": 5,
  "total_sessions": 27,
  "total_phases": 26,
  "phases": {
    "phase-01-foundation": { "status": "completed", "sessions": [0, 1] },
    "phase-02-cli":        { "status": "completed", "sessions": [2] }
  },
  "known_issues": [],
  "modules": {
    "cli":    { "status": "completed", "session": 2 },
    "engine": { "status": "completed", "session": 3 }
  }
}
```

**Cập nhật cuối mỗi session**: tăng `phase`, `current_session`, set module `"completed"`.

### 3.5 Phase READMEs — "Spec Chi Tiết"

**Mỗi phase có 1 README** mô tả:
- **Mục tiêu** (1-2 câu)
- **Files tạo mới**: class, constructor, methods, parameters, return type
- **Interfaces** đầy đủ
- **Kiểm tra**: test cases cụ thể (input → expected output)
- **Edge cases**: lỗi biên cần handle
- **Dependencies**: phase nào phải xong trước

### 3.6 DECISIONS.md — "Sổ Quyết Định"

```markdown
## D1: OpenClaw Integration via HTTP Gateway
**Quyết định**: Giao tiếp qua REST API
**Lý do**: Tách biệt, dễ thay thế engine
**Alternatives**: Embed trực tiếp (rejected: couple chặt)

## D2: CEO Agent Always-On
**Quyết định**: CEO chạy 24/7 via cron, staff event-driven
**Lý do**: CEO phải sẵn sàng delegate bất cứ lúc nào
```

### 3.7 docs/INDEX.md — "Bản Đồ Tài Liệu"

Bảng cross-reference: Phase nào cần đọc doc nào thêm.

```markdown
| Phase | Phase README | Dependencies | Docs liên quan |
|---|---|---|---|
| P3 Engine | phase-03/README.md | P1 | openclaw-integration.md |
| P10 Memory | phase-10/README.md | P1,P5 | MEMORY_RESEARCH.md |
```

---

## 4. Hệ Thống Skills (obra/superpowers — 14 Skills)

### 4.1 Skills là gì?

Skills = **tài liệu hướng dẫn** cho AI, đặt tại `.agent/skills/`. Mỗi skill có `SKILL.md` với YAML frontmatter:

```yaml
---
name: test-driven-development
description: Use when implementing any feature or bugfix, before writing implementation code
---
```

**AI tự động load** skill khi context phù hợp (dựa vào `description`).

### 4.2 Bảng 14 Skills

| Khi nào | Skill | Mục đích |
|---|---|---|
| Trước khi code — làm rõ yêu cầu | `brainstorming` | Hỏi 1 câu/lần, propose 2-3 approaches, get approval |
| Lập kế hoạch | `writing-plans` | Chia task 2-5 phút, exact file paths, code sẵn trong plan |
| Thực thi plan | `executing-plans` | Load plan → review → execute bite-sized → verify |
| Code bất kỳ file | `test-driven-development` | RED→GREEN→REFACTOR. Iron Law: test FIRST |
| Gặp bug | `systematic-debugging` | 4-phase: root cause → pattern → hypothesis → fix |
| Trước khi nói "xong" | `verification-before-completion` | RUN → READ → VERIFY → chỉ sau đó mới claim |
| Review trước commit | `requesting-code-review` | Review vs plan, report by severity |
| Nhận feedback | `receiving-code-review` | Respond to review comments |
| Chạy nhiều agent song song | `dispatching-parallel-agents` | Concurrent subagent workflows |
| Subagent per task | `subagent-driven-development` | Fresh agent mỗi task + 2-stage review |
| Tạo branch riêng | `using-git-worktrees` | Isolated workspace, clean test baseline |
| Kết thúc branch | `finishing-a-development-branch` | Verify tests → merge/PR/discard |
| Tạo skill mới | `writing-skills` | TDD cho documentation |
| Hiểu superpowers | `using-superpowers` | Introduction to skills system |

### 4.3 Core Workflow (7 bước chuẩn)

```
1. brainstorming    → Làm rõ yêu cầu, explore alternatives
2. using-git-worktrees → Tạo workspace riêng
3. writing-plans    → Chia thành bite-sized tasks (2-5 phút/task)
4. executing-plans / subagent-driven-development → Thực thi
5. test-driven-development → RED→GREEN→REFACTOR cho mỗi file
6. requesting-code-review → Review trước commit
7. finishing-a-development-branch → Merge/PR/cleanup
```

### 4.4 Cách tạo Skill mới

```
.agent/skills/
  my-skill-name/
    SKILL.md              # Main reference (bắt buộc)
    supporting-file.ts    # Nếu cần (script, template)
```

**SKILL.md format**:
```yaml
---
name: my-skill-name
description: Use when [specific triggering conditions — KHÔNG summarize workflow]
---
# Skill Name

## Overview — Core principle (1-2 câu)
## When to Use — Bullets + khi KHÔNG nên dùng
## The Iron Law — Quy tắc bất di bất dịch
## Core Pattern — Before/after, steps
## Common Rationalizations — Bảng excuse | reality
## Red Flags — STOP and start over
## Verification Checklist — Checklist trước khi claim xong
```

**PRO TIP**: Description chỉ ghi **khi nào dùng**, KHÔNG ghi workflow. Nếu ghi workflow trong description, AI sẽ follow description thay vì đọc skill → miss detail.

---

## 5. Session Workflow Chi Tiết

### 5.1 Tạo file `.agent/workflows/session.md`

```markdown
---
description: How to start and end a coding session
---

# Session Workflow

## Starting a Session
1. Read PROGRESS.md         → session trước
2. Read architecture_state.json → module status
3. Read RULES.md            → luật chơi
4. Read SESSIONS.md         → session hiện tại
5. Read phase README        → spec chi tiết
6. Read INDEX.md            → docs liên quan
7. Present plan to owner    → files, tests, CLI
8. CROSS-CHECK plan vs spec → mọi item spec đều có trong plan
9. Wait for confirmation

## During a Session (per file)
1. Read TDD skill           → follow strictly
2. Write failing test       → RED
3. Run test → verify FAILS
4. Write minimal code       → GREEN
5. Refactor if needed
6. Commit immediately

## When Debugging
1. Read systematic-debugging skill → 4-phase process
2. NEVER guess-fix. Root cause first.
3. Fix fails 2 times → STOP, report, change approach

## Before Claiming "Done"
1. Read verification-before-completion skill
2. Run ALL tests → read output → confirm 0 failures
3. CLI commands work → confirm
4. Only THEN claim with evidence

## SPEC VERIFICATION (trước khi đóng session)
1. Open phase README
2. For EVERY item: file exists? content đúng? tests pass?
3. For EVERY "Kiểm tra" item: actually ran? evidence captured?
4. If anything missing → do it BEFORE closing

## DOC CONSISTENCY CHECK
If decision changed during session:
1. Grep ALL docs for old term
2. Update EVERY reference
3. Add to DECISIONS.md

## Ending a Session
1. Run SPEC VERIFICATION
2. Run DOC CONSISTENCY CHECK
3. Update PROGRESS.md
4. Update architecture_state.json
5. Final commit: docs: update progress session N
```

### 5.2 Flow Visual

```
┌──────────────────────────────────────────────┐
│ SESSION START                                 │
│ ┌─ 1. Read 6 files ─────────────────────────┐│
│ │ RULES→PROGRESS→architecture→SESSIONS→phase ││
│ └────────────────────────────────────────────┘│
│ ┌─ 2. Plan + Cross-Check ───────────────────┐│
│ │ List files (≤6), tests, CLI → owner OK    ││
│ └────────────────────────────────────────────┘│
│ ┌─ 3. Code (TDD per file) ──────────────────┐│
│ │  ┌─RED──┐  ┌─GREEN─┐  ┌─REFACTOR─┐       ││
│ │  │ Test │→ │  Code │→ │  Clean   │→COMMIT ││
│ │  │ FAIL │  │  PASS │  │  PASS    │        ││
│ │  └──────┘  └───────┘  └──────────┘        ││
│ └────────────────────────────────────────────┘│
│ ┌─ 4. Verify ───────────────────────────────┐│
│ │ Full test suite → SPEC check → Doc check  ││
│ └────────────────────────────────────────────┘│
│ ┌─ 5. Close ────────────────────────────────┐│
│ │ Update PROGRESS + architecture_state      ││
│ │ Commit: docs: update progress session N   ││
│ └────────────────────────────────────────────┘│
└──────────────────────────────────────────────┘
```

---

## 6. TDD Trong Vibecoding (Chi Tiết)

### 6.1 Red-Green-Refactor

```
RED:      Viết 1 test → chạy → phải FAIL → xác nhận fails đúng lý do
GREEN:    Viết code TỐI THIỂU → chạy → test PASS
REFACTOR: Dọn code, giữ test PASS → commit
```

### 6.2 Quy Tắc Không Thương Lượng

- **Viết code trước test?** → **XÓA code. Bắt đầu lại TDD.**
- Không giữ code cũ làm "reference"
- Không "adapt" code cũ khi viết test
- Test pass ngay = test sai → fix test

### 6.3 Bảng Chống Rationalization

| Lý Do Bào Chữa | Sự Thật |
|---|---|
| "Quá đơn giản để test" | Simple code vẫn hỏng. Test mất 30 giây |
| "Viết test sau cũng được" | Test pass ngay = chứng minh không gì |
| "Đã test thủ công rồi" | Ad-hoc ≠ systematic. Không re-run được |
| "TDD chậm hơn" | TDD NHANH hơn debugging. Pragmatic = test-first |
| "Xóa X giờ code phí" | Sunk cost fallacy. Code không test = nợ kỹ thuật |
| "Cần explore trước" | OK. Xong thì XÓA explore, bắt đầu TDD |

---

## 7. Systematic Debugging (4 Phases)

Khi gặp bug, PHẢI theo 4 phase — KHÔNG được nhảy vào fix:

### Phase 1: Root Cause Investigation
- Đọc error message + stack trace **đầy đủ**
- Reproduce lỗi 100% reliable
- Check recent changes (git diff)
- Trace data flow ngược lại đến nguồn

### Phase 2: Pattern Analysis
- Tìm code tương tự đang HOẠT ĐỘNG
- So sánh: khác gì giữa working vs broken?
- Liệt kê MỌI khác biệt (dù nhỏ)

### Phase 3: Hypothesis & Testing
- Form 1 giả thuyết cụ thể: "X là root cause vì Y"
- Test với thay đổi NHỎ NHẤT có thể
- 1 variable mỗi lần — không fix nhiều thứ cùng lúc

### Phase 4: Implementation
- Viết failing test reproduce bug
- Fix root cause (không fix symptom)
- Verify: test pass + không break tests khác
- **Fix fails 3 lần → DỪNG → hỏi: kiến trúc có vấn đề?**

---

## 8. Verification Before Completion

### Gate Function (BẮT BUỘC trước khi claim "xong"):

```
1. IDENTIFY: Lệnh nào chứng minh claim?
2. RUN:      Chạy lệnh ĐẦY ĐỦ (fresh)
3. READ:     Đọc TOÀN BỘ output
4. VERIFY:   Output đúng với claim?
5. ONLY THEN: Nói "xong"
```

### Red Flags — DỪNG nếu dùng từ:
- "chắc là", "có lẽ", "nên được", "hình như"
- "Xong!" (trước khi chạy verify)

---

## 9. Cách Tạo Dự Án Mới (Step-by-Step)

### Bước 1: PRD.md
```
- User persona: ai dùng?
- Features F1-FN: mô tả + acceptance criteria
- Non-functional: performance, security, cost
```

### Bước 2: ARCHITECTURE.md
```
- System diagram (5 tầng hoặc phù hợp)
- Tech stack
- Component list
- Data flow
```

### Bước 3: DECISIONS.md
```
Mỗi quyết định: What + Why + Alternatives rejected
```

### Bước 4: Chia SESSIONS.md
```
- Session 0: Foundation docs + rules
- Session 1: Scaffold (project init)
- Session 2-N: Mỗi session = 1 module, ≤6 files
- Ghi rõ: files, tests, CLI, commit message, dependencies
```

### Bước 5: Phase READMEs
```
Mỗi phase: mục tiêu + files + class/methods + tests + edge cases + dependencies
```

### Bước 6: RULES.md (copy template ở section 3.1)

### Bước 7: architecture_state.json + PROGRESS.md (ban đầu trống)

### Bước 8: INDEX.md (cross-reference map)

### Bước 9: Skills (optional nhưng khuyến khích)
```
.agent/skills/
  test-driven-development/SKILL.md
  systematic-debugging/SKILL.md
  verification-before-completion/SKILL.md
  writing-plans/SKILL.md
  ...
```

### Bước 10: Session Workflow
```
.agent/workflows/session.md
```

---

## 10. Template Nhanh — Cấu Trúc Thư Mục

```
my-project/
├── RULES.md                    ← Luật chơi (QUAN TRỌNG NHẤT)
├── SESSIONS.md                 ← Chia sessions (files + tests + CLI)
├── PROGRESS.md                 ← Nhật ký (AI đọc đầu session)
├── ARCHITECTURE.md             ← Sơ đồ kiến trúc
├── DECISIONS.md                ← Sổ quyết định D1-DN
├── PRD.md                      ← Product requirements F1-FN
├── architecture_state.json     ← Module status (JSON)
├── docs/
│   ├── INDEX.md                ← Cross-reference map
│   ├── VIBE_CODING_REFERENCE.md ← Anthropic + superpowers ref
│   └── phases/
│       ├── phase-01-xxx/README.md  ← Spec chi tiết
│       ├── phase-02-xxx/README.md
│       └── ...
├── .agent/
│   ├── skills/                 ← 14 AI skills (SKILL.md)
│   │   ├── test-driven-development/
│   │   ├── systematic-debugging/
│   │   ├── verification-before-completion/
│   │   ├── writing-plans/
│   │   ├── executing-plans/
│   │   ├── brainstorming/
│   │   └── ...
│   └── workflows/
│       └── session.md          ← Session workflow
├── src/                        ← Source code
├── tests/                      ← Mirror src/ structure
└── .env.example                ← Environment template
```

---

## 11. Anthropic Claude Code — 11 Best Practices Tóm Tắt

| # | Practice | Áp dụng trong dự án |
|---|---|---|
| 1 | Give AI a way to verify work | TDD + `npx jest` output |
| 2 | Explore → Plan → Code | RULES.md workflow 5 bước |
| 3 | Provide specific context | Phase READMEs, @file references |
| 4 | Write effective CLAUDE.md/RULES.md | RULES.md v6 (370 dòng) |
| 5 | Create skills | 14 skills tại `.agent/skills/` |
| 6 | Create custom subagents | `.agent/agents/` (optional) |
| 7 | Manage context aggressively | Chỉ đọc files cần cho session |
| 8 | Course-correct early | Fail-Fast: 2 lần sai → dừng |
| 9 | Use subagents for investigation | Dispatch parallel agents |
| 10 | Rewind with checkpoints | Git commits after each file |
| 11 | Resume conversations | PROGRESS.md = resume guide |

### 5 Common Failure Patterns

| Pattern | Nguyên nhân | Fix |
|---|---|---|
| Kitchen sink session | Trộn nhiều task | 1 session = 1 module |
| Correcting over and over | Context bị ô nhiễm | Fail-Fast rule |
| Over-specified RULES.md | Rules quá dài, AI bỏ qua | Prune ruthlessly |
| Trust-then-verify gap | Tin output không verify | Verification Iron Law |
| Infinite exploration | Đọc không giới hạn | Scope narrowly |

---

## 12. Kết Quả Thực Tế

| Metric | Giá trị |
|---|---|
| Sessions hoàn thành | 9/27 (trong 1 ngày) |
| Tests | 75 pass, 0 fail |
| Test suites | 7 |
| Bugs tồn đọng | 0 |
| Files tạo mới | ~30+ |
| Thời gian trung bình/session | ~10-15 phút |
| Tỷ lệ test pass lần đầu | ~90% |
| Source files per session | 2-4 (+ 1 test + 1 CLI) |

**Kết luận**: Với bộ tài liệu đầy đủ + 14 skills + session workflow, AI coding assistant deliver **1 module hoàn chỉnh mỗi 10-15 phút** với 0 bug và 100% test coverage.

---

## 13. Tips Nâng Cao

### 13.1 Cross-Check = Vũ Khí Bí Mật
Trước khi AI code, **CROSS-CHECK plan vs phase README spec**. Mọi item trong spec phải xuất hiện trong plan. Thiếu = bug.

### 13.2 Mock Dependencies
Test không cần DB thật — mock Prisma, mock Engine. Tests chạy < 2s. Fast tests = fast iteration.

### 13.3 CLI-First Development
Mỗi feature phải có CLI command. CLI = "UI tối thiểu" cho AI test. Chưa có frontend vẫn dùng được toàn bộ system.

### 13.4 Commit Granularity
- Commit **sau mỗi file hoàn thành** (không chờ cuối session)
- Commit cuối: `docs: update progress session N`
- Format: `<type>(<scope>): <description> (N/N tests)`

### 13.5 Human-in-the-Loop
- AI trình plan → owner nói "LGTM" → AI code
- Owner duyệt implementation plan, KHÔNG duyệt từng dòng code
- Trust but verify: owner xem test results, không cần review code
