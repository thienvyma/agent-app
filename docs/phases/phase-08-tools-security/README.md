# Phase 8: Tools and Security (S8)

## Tru cot 1: Quan ly Nhan su - Cong cu chuyen biet

## Muc tieu
ToolRegistry + ToolPermission + AuditLogger.
Moi nhan vien AI duoc cap quyen truy cap cac API/tools khac nhau.

## Session 8
- Files: tool-registry.ts, tool-permission.ts, audit-logger.ts, tests/
- ToolRegistry: register custom tools (API Facebook, database vat tu, etc.)
- ToolPermission: per-agent ACL (Marketing duoc Facebook API, Finance duoc DB)
- AuditLogger: log moi agent action (cho compliance + debug)
- CLI: ae tool list, ae tool grant agent-id tool-name, ae audit search
- Test: agent A dung tool X OK, agent B bi chan

## Lien quan PRD: F1 toolPermissions, F11 Audit, Cong cu chuyen biet
