# Phase 6: Company Manager (S6)

## Tru cot 1: Quan ly Nhan su - CRUD + Hierarchy

## Muc tieu
CompanyManager CRUD + HierarchyEngine (org tree) + AgentConfigBuilder
(tao agent voi role, SOP, model, tools, skills).

## Session 6
- Files: company-manager.ts, hierarchy-engine.ts, agent-config-builder.ts, tests/
- CompanyManager: create/read/update company + departments
- HierarchyEngine: CEO -> Departments -> Agents (tree queries)
- AgentConfigBuilder: ae agent create --role CEO --sop ... --model qwen
- CLI: ae company create, ae company info, ae agent create, ae agent list
- Test: create company -> department -> agent (with SOP), query hierarchy

## Lien quan PRD: F1 Company Structure, Phan quyen va Vai tro
