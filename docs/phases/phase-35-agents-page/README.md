# Phase 35: Agents Dashboard Page (S35)

> /agents — CRUD agents, deploy/undeploy, status real-time.
> Wire: S5-S7 (Company, Agent, Deploy) + S22 (AgentCard) + S32 (DB)

## Tinh nang
1. Agent list voi status badges (S22 StatusBadge)
2. Add/Edit agent form (name, role, department, model)
3. Deploy / Undeploy buttons (S7 logic)
4. Agent detail page: /agents/[id]
   - Chat interface (send message → OpenClaw)
   - Task history
   - Token usage chart
   - Cost breakdown
5. Filter by department, status (S23 AgentFilter)
6. Real-time status updates (S19 RealtimeHub)

## API routes wire
```
GET    /api/agents          → AgentRepo.list()
POST   /api/agents          → AgentRepo.create() 
GET    /api/agents/[id]     → AgentRepo.findById()
PUT    /api/agents/[id]     → AgentRepo.update()
DELETE /api/agents/[id]     → AgentRepo.delete()
POST   /api/agents/[id]/deploy   → OpenClawAdapter.deploy()
POST   /api/agents/[id]/undeploy → OpenClawAdapter.undeploy()
POST   /api/agents/[id]/chat     → Pipeline.execute()
```

## Files tao moi
1. `src/app/(dashboard)/agents/page.tsx` — Agent list page
2. `src/app/(dashboard)/agents/[id]/page.tsx` — Agent detail
3. `src/app/(dashboard)/agents/components/agent-list.tsx`
4. `src/app/(dashboard)/agents/components/agent-form.tsx`
5. `src/app/(dashboard)/agents/components/agent-chat.tsx`
6. Update API routes /api/agents → use repository
7. `tests/pages/agents-page.test.ts`
