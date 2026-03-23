# Phase 13: Agent Messaging (S13)

> Tru cot 4: Phoi hop nhom - Agent tu giao tiep voi nhau
> Internal Pub/Sub cho Agent-to-Agent communication

---

## Muc tieu
MessageBus (BullMQ pub/sub) + MessageRouter (intent -> dung agent).

## 3 Communication Patterns (tu D3)

### Pattern 1: Delegate (mac dinh, pho bien nhat)
CEO -> 1 Agent: "Marketing, len ke hoach thang 4"
Flow: CEO gui message -> MessageRouter -> tim Marketing Agent -> publish

### Pattern 2: Chain (workflow co dinh A -> B -> C)
VD: Research -> Write -> Review -> Publish
Flow: A hoan thanh -> tu dong trigger B -> B hoan thanh -> trigger C

### Pattern 3: Group (brainstorm, hop nhom)
CEO gui broadcast den nhieu agents cung luc
VD: CEO + Marketing + Sales hop tuan

## Architecture

`
Agent A  --publish-->  MessageBus (BullMQ)  --deliver-->  Agent B
                           |
                     MessageRouter
                    (parse intent -> find target agent)
`

BullMQ Queue per Agent:
  queue:agent:ceo-123
  queue:agent:marketing-456
  queue:agent:finance-789

## Files tao moi

### 1. src/core/messaging/message-bus.ts
class MessageBus:
  - constructor(redis: Redis, db: PrismaClient)
  - async publish(message: BusMessage): string (messageId)
    1. Validate message (from, to, content required)
    2. Create Message record in DB
    3. Add to BullMQ queue for target agent
    4. Emit event 'message:new' (cho Socket.IO Phase 19)
    5. Return messageId
  - async subscribe(agentId: string, handler: MessageHandler): void
    Create BullMQ worker for agent queue:
    worker.on('completed', job => handler(job.data))
  - async broadcast(message: BusMessage, agentIds: string[]): void
    For each agentId: publish(message with toAgentId = agentId)
  - async chain(steps: ChainStep[]): ChainResult
    1. Execute step[0]
    2. Wait for completion
    3. Pass result to step[1]
    4. Repeat until all steps done
    5. Return compiled results
  - async getHistory(agentId: string, limit: number): Message[]
    Query DB for messages involving this agent

interface BusMessage:
  fromAgentId: string
  toAgentId: string
  content: string
  type: MessageType  // DELEGATE | REPORT | CHAIN | GROUP | ALERT | ESCALATION
  metadata?: {
    taskId?: string
    priority?: number
    replyTo?: string    // for conversational threading
  }

interface ChainStep:
  agentId: string
  instruction: string
  transformResult?: (result: string) => string  // process output before next step

### 2. src/core/messaging/message-router.ts
class MessageRouter:
  - constructor(hierarchy: HierarchyEngine, messageBus: MessageBus, engine: IAgentEngine)
  - async route(fromAgentId: string, content: string, type: MessageType): void
    1. If DELEGATE: parse intent -> HierarchyEngine.findBestAgent(content) -> publish
    2. If CHAIN: decompose -> create chain steps -> messageBus.chain()
    3. If GROUP: parse target roles -> find all agents -> messageBus.broadcast()
    4. If ESCALATION: route to CEO first, then owner if CEO can't resolve
  - async routeToRole(content: string, role: string): void
    hierarchy.findAgentsByRole(role) -> publish to first available
  - async routeToOwner(content: string, agentId: string): void
    Send via Telegram notification (Phase 20)

### 3. src/types/message.ts
  MessageType enum, BusMessage, ChainStep, ChainResult types
  (bo sung len schema da co o Phase 5)

## CLI bo sung:
  ae message send <fromId> <toId> "content" [--type delegate|chain|group]
  ae message list [--agent <id>] [--type <type>] [--limit 20]

## Kiem tra
1. Agent A gui delegate message -> Agent B nhan trong < 1s
2. Chain A -> B -> C: tat ca hoan thanh theo thu tu
3. Broadcast to 3 agents: tat ca nhan cung luc
4. MessageRouter: "can tinh chi phi" -> routes to Finance Agent
5. Message persisted in DB + queryable
6. Queue survives Redis restart (BullMQ persistence)

## Edge Cases
- Target agent khong ton tai -> error + log
- Target agent IDLE (chua deploy) -> queue message, deliver khi deploy
- Message loop (A -> B -> A -> B...) -> detect cycle, break
- BullMQ queue full -> backpressure, alert owner
- Redis connection lost -> reconnect + resume

## Dependencies
- Phase 5 (Message table)
- Phase 6 (HierarchyEngine for routing)
- Phase 1 (Redis for BullMQ)

## Lien quan PRD: F6 Agent Communication, D3 Mix 3 Communication Patterns
