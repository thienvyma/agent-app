# Phase 13: Agent Messaging (S13)

> Tru cot 4: Phoi hop nhom - Agent tu noi chuyen voi nhau

---

## Muc tieu
MessageBus (BullMQ pub/sub) + MessageRouter (intent -> dung agent).

## 3 Communication Patterns (D3)
1. Delegate: CEO -> 1 agent (pho bien nhat)
2. Chain: Agent A -> Agent B -> Agent C (workflow co dinh)
3. Group: broadcast to nhieu agents (meeting/brainstorm)

## Files tao moi

### 1. src/core/messaging/message-bus.ts
class MessageBus:
  - constructor(redis: Redis)
  - async publish(message: BusMessage): void
    1. Create Message record in DB
    2. Add to BullMQ queue for target agent
    3. Emit event for Socket.IO (Phase 19)
  - async subscribe(agentId: string, handler: MessageHandler): void
    1. Create BullMQ worker for agent queue
    2. On message -> handler(message)
  - async broadcast(message: BusMessage, agentIds: string[]): void
    Publish to multiple agents (Group pattern)
  - async chain(messages: BusMessage[]): void
    Execute sequentially: A completes -> trigger B -> trigger C

### 2. src/core/messaging/message-router.ts
class MessageRouter:
  - constructor(hierarchy: HierarchyEngine, messageBus: MessageBus)
  - async route(fromAgentId: string, content: string, type: MessageType): void
    1. Parse intent from content (keyword matching or LLM classification)
    2. Find target agent(s) based on intent + role
    3. Publish via MessageBus
  - async routeToRole(content: string, role: string): void
    Find agent with matching role -> publish

### 3. src/types/message.ts
  (da dinh nghia o Phase 5 schema, bo sung types o day)

## CLI: ae message send <fromId> <toId> "content"

## Kiem tra
1. Agent A sends delegate message -> Agent B receives
2. Chain: A -> B -> C completes in order
3. Broadcast: message reaches all target agents
4. MessageRouter: "can tinh chi phi" -> routes to Finance Agent

## Dependencies: Phase 5 (Message table), Phase 6 (HierarchyEngine), Redis (BullMQ)
## Lien quan: PRD F6 Agent Communication, D3 Mix 3 Patterns
