# Phase 6: Company Manager (S6)

> Tru cot 1: Quan ly Nhan su - CRUD + Org Chart + Agent Config

---

## Muc tieu
CompanyManager CRUD + HierarchyEngine (org tree queries) +
AgentConfigBuilder (tao agent voi role, SOP, model, tools, skills).

## Files tao moi

### 1. src/core/company/company-manager.ts
class CompanyManager:
  - constructor(db: PrismaClient)
  - async createCompany(data: CreateCompanyInput): Company
  - async getCompany(id: string): Company + departments + agents
  - async updateCompany(id: string, data: UpdateCompanyInput): Company
  - async createDepartment(companyId: string, data: CreateDeptInput): Department
  - async createAgent(departmentId: string, data: CreateAgentInput): Agent
  - async updateAgent(agentId: string, data: UpdateAgentInput): Agent
  - async deleteAgent(agentId: string): void (soft delete, check no active tasks)
  - async getAgent(agentId: string): Agent + department + toolPermissions

### 2. src/core/company/hierarchy-engine.ts
class HierarchyEngine:
  - constructor(db: PrismaClient)
  - async getOrgTree(companyId: string): OrgNode[]
    Return nested tree: Company -> Departments -> Agents
  - async findAgentsByRole(companyId: string, role: string): Agent[]
    VD: findAgentsByRole("marketing") -> [Marketing Manager, Content Writer]
  - async findBestAgent(companyId: string, taskDescription: string): Agent
    Match task keywords -> agent skills/role (simple keyword matching)
    Phase 9 TaskDecomposer se dung function nay

### 3. src/core/company/agent-config-builder.ts
class AgentConfigBuilder:
  - static fromDBAgent(agent: Agent): AgentConfig
    Map Prisma Agent record -> IAgentEngine AgentConfig
  - static buildSystemPrompt(agent: Agent, context?: string): string
    Combine: role description + SOP + injected context (tu ContextBuilder Phase 12)
    + tool descriptions + constraints

### 4. tests/company/company-manager.test.ts
- Create company -> departments -> agents
- Query hierarchy -> correct tree structure
- findBestAgent("viet content marketing") -> Marketing Agent
- Delete agent with active tasks -> error
- AgentConfigBuilder produces valid IAgentEngine config

## CLI bo sung:
  ae company create --name "My Enterprise"
  ae company info -> org chart ASCII
  ae agent create --dept marketing --role "Content Writer" --model qwen2.5:7b --sop "..."
  ae agent list -> table of all agents

## Dependencies: Phase 5 (DB schema)
## Lien quan: PRD F1 Company Structure, Phan quyen va Vai tro
