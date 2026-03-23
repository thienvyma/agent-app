# Phase 25: End-to-End Testing (S25)

> Full flow test: from owner command to dashboard display

---

## Muc tieu
E2E test covering ENTIRE system flow from user input to final output.

## The Full Flow Test

### test: "Complete Enterprise Operation"
1. SETUP
   - Docker: PostgreSQL + Redis running
   - OpenClaw: Gateway running on port 18789
   - Ollama: running for embeddings
   - Prisma: migrated + seeded

2. CREATE COMPANY
   - POST /api/company { name: "Test Corp" }
   - POST /api/company/:id/departments { name: "Marketing" }
   - POST /api/company/:id/departments { name: "Finance" }

3. CREATE AND DEPLOY AGENTS
   - POST /api/agents { name: "CEO", role: "ceo", isAlwaysOn: true, ... }
   - POST /api/agents { name: "Marketing Mgr", role: "marketing", ... }
   - POST /api/agents { name: "Finance Analyst", role: "finance", ... }
   - POST /api/agents/ceo/deploy -> CEO deployed
   - POST /api/agents/marketing/deploy -> Marketing deployed
   - POST /api/agents/finance/deploy -> Finance deployed
   - Verify: GET /api/agents -> all RUNNING

4. TASK DECOMPOSITION
   - POST /api/tasks { description: "Launch promotion campaign" }
   - TaskDecomposer splits into:
     Sub-task 1: "Write campaign content" -> Marketing
     Sub-task 2: "Calculate ROI" -> Finance
   - Verify: GET /api/tasks -> parent + 2 sub-tasks

5. AGENT EXECUTION
   - Marketing agent writes content -> task completed
   - Finance agent calculates ROI -> task completed
   - Verify: both sub-tasks status = COMPLETED

6. APPROVAL WORKFLOW
   - Marketing result triggers approval (customer-facing)
   - Verify: GET /api/approvals -> 1 pending
   - POST /api/approvals/:id/approve
   - Verify: approval resolved + task continues

7. TELEGRAM INTEGRATION
   - Simulate /status command -> bot responds with stats
   - Simulate /task command -> CEO receives
   - Approval inline keyboard -> owner approves
   - Auto-notification -> owner receives result

8. MEMORY AND LEARNING
   - Conversations logged to VectorStore
   - ae memory search "campaign" -> returns relevant results
   - Reject a task -> CorrectionLog created
   - ContextBuilder includes correction in next similar task

9. COST AND DASHBOARD
   - Token usage tracked for all agents
   - GET /api/cost/report -> shows usage
   - Dashboard pages load with real data
   - Socket.IO events received for all actions

10. CLEANUP
    - Undeploy all agents
    - Verify: all IDLE

## Files tao moi
- tests/e2e/full-flow.test.ts - main E2E test
- tests/e2e/helpers.ts - setup/teardown, API call helpers, assertions

## Kiem tra: ENTIRE flow runs end-to-end without errors
## Estimated duration: 5-10 minutes for full run

## Dependencies: ALL previous phases (P1-P24)
## Lien quan: All PRD features F1-F11
