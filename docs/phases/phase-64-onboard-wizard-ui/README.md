# Phase 64: Onboard Wizard UI

> **Session 64** | 3 files | TDD (Red → Green → Refactor)
> **Phụ thuộc**: Phase 63 (onboard backend)

---

## Bối Cảnh
- Backend onboard logic ready (Phase 63)
- API route `/api/openclaw/onboard` ready
- Settings page (471 dòng) cần thêm wizard component
- Design: dark theme, match existing panels style

## Mục Tiêu
Tạo step-by-step wizard UI trong Settings → guided first-time setup.

## Files (3)

### 1. [NEW] `tests/components/onboard-wizard.test.tsx`
Tests:
- Render → shows 6 step indicators
- Step 1 active → others dimmed
- Click "Check" → calls API → step 1 complete → step 2 unlocks
- Step fail → show error + retry button
- Provider form → pre-fill defaults (Ollama LAN)
- Model step → "Fetch Models" button
- Complete → show success summary + "Go to Dashboard" button
- Skip → "I've already configured OpenClaw" link

### 2. [NEW] `src/components/settings/onboard-wizard.tsx`
UI structure:
```
┌─────────────────────────────────────┐
│ 🦞 OpenClaw Setup Wizard          │
│                                     │
│ ● Step 1  ○ Step 2  ○ Step 3  ...  │
│ ─────────────────────────────       │
│                                     │
│ [Step Content: form/action/result]  │
│                                     │
│ [Back]              [Next/Continue] │
└─────────────────────────────────────┘
```

Pre-fill defaults (from `Huong_Dan_Ket_Noi_Qwen.md`):
- Provider: `ollama-lan`
- Base URL: `http://192.168.1.35:8080/v1`
- API Key: `sk-local`
- Model: `Qwen3.5-35B-A3B-Coder`

### 3. [MODIFY] `src/app/(dashboard)/settings/openclaw/page.tsx`
- Import `OnboardWizard`
- Thêm banner: "First time? → Launch Setup Wizard"
- Conditional: if `cliAvailable && !gateway?.running` → show wizard prominently
- Wizard dismissible (collapse/hide after complete)

## Kiểm Tra
- [ ] Wizard renders all 6 steps
- [ ] Each step calls correct API endpoint
- [ ] Error handling: clear messages + retry
- [ ] Pre-filled defaults correct (Qwen LAN)
- [ ] `npx jest` → 0 failures
- [ ] `npx tsc --noEmit` → 0 errors
