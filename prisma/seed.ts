/**
 * Prisma seed script — populates database with sample company data.
 *
 * Creates:
 * - 1 Company: "My Enterprise"
 * - 3 Departments: Executive, Marketing, Finance
 * - 3 Agents: CEO (always-on), Marketing Manager, Finance Analyst
 * - Sample ToolPermissions for each agent
 *
 * Run: npx prisma db seed
 *
 * @module prisma/seed
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("🌱 Seeding database...");

  // 1. Create Company
  const company = await prisma.company.upsert({
    where: { id: "company-001" },
    update: {},
    create: {
      id: "company-001",
      name: "My Enterprise",
      description: "AI-powered autonomous business",
      config: {
        timezone: "Asia/Ho_Chi_Minh",
        language: "vi",
        maxAgents: 10,
        budgetLimit: 100,
      },
    },
  });
  console.log(`  ✅ Company: ${company.name}`);

  // 2. Create Departments
  const executive = await prisma.department.upsert({
    where: { id: "dept-exec" },
    update: {},
    create: {
      id: "dept-exec",
      name: "Executive",
      description: "Strategic leadership and oversight",
      companyId: company.id,
    },
  });

  const marketing = await prisma.department.upsert({
    where: { id: "dept-marketing" },
    update: {},
    create: {
      id: "dept-marketing",
      name: "Marketing",
      description: "Content creation, social media, campaigns",
      companyId: company.id,
    },
  });

  const finance = await prisma.department.upsert({
    where: { id: "dept-finance" },
    update: {},
    create: {
      id: "dept-finance",
      name: "Finance",
      description: "Financial analysis, budgeting, reporting",
      companyId: company.id,
    },
  });
  console.log(`  ✅ Departments: ${executive.name}, ${marketing.name}, ${finance.name}`);

  // 3. Create Agents
  const ceo = await prisma.agent.upsert({
    where: { id: "agent-ceo-001" },
    update: {},
    create: {
      id: "agent-ceo-001",
      name: "CEO Agent",
      role: "ceo",
      sop: `# CEO Standard Operating Procedure

## Daily routine:
1. Check all department reports
2. Review pending tasks and approvals
3. Assign new strategic tasks to departments
4. Monitor budget usage

## Decision rules:
- Tasks > $50 budget: require owner approval
- Agent errors > 3: pause and escalate
- Revenue changes > 10%: alert owner via Telegram`,
      model: "qwen2.5:7b",
      tools: ["google_sheets", "email", "calendar"],
      skills: ["strategic_planning", "delegation", "reporting"],
      isAlwaysOn: true,
      cronSchedule: "*/5 * * * *",
      departmentId: executive.id,
    },
  });

  const marketingManager = await prisma.agent.upsert({
    where: { id: "agent-marketing-001" },
    update: {},
    create: {
      id: "agent-marketing-001",
      name: "Marketing Manager",
      role: "marketing",
      sop: `# Marketing Manager SOP

## Responsibilities:
1. Create social media content (Facebook, Instagram)
2. Manage ad campaigns
3. Track engagement metrics
4. Report weekly to CEO

## Content rules:
- Brand voice: professional but friendly
- Post frequency: 3x/week minimum
- Always include call-to-action`,
      model: "qwen2.5:7b",
      tools: ["facebook_api", "canva", "analytics"],
      skills: ["content_writing", "social_media", "data_analysis"],
      isAlwaysOn: false,
      departmentId: marketing.id,
    },
  });

  const financeAnalyst = await prisma.agent.upsert({
    where: { id: "agent-finance-001" },
    update: {},
    create: {
      id: "agent-finance-001",
      name: "Finance Analyst",
      role: "finance",
      sop: `# Finance Analyst SOP

## Responsibilities:
1. Track daily revenue and expenses
2. Generate financial reports
3. Alert on budget anomalies
4. Reconcile accounts weekly

## Alert thresholds:
- Daily spend > $20: notify CEO
- Revenue drop > 15%: urgent alert
- Missing transactions: escalate immediately`,
      model: "qwen2.5:7b",
      tools: ["google_sheets", "quickbooks", "calculator"],
      skills: ["financial_analysis", "reporting", "data_analysis"],
      isAlwaysOn: false,
      departmentId: finance.id,
    },
  });
  console.log(`  ✅ Agents: ${ceo.name}, ${marketingManager.name}, ${financeAnalyst.name}`);

  // 4. Create ToolPermissions
  const toolPerms = [
    { agentId: ceo.id, toolName: "google_sheets", grantedBy: "system" },
    { agentId: ceo.id, toolName: "email", grantedBy: "system" },
    { agentId: ceo.id, toolName: "calendar", grantedBy: "system" },
    { agentId: marketingManager.id, toolName: "facebook_api", grantedBy: "system" },
    { agentId: marketingManager.id, toolName: "canva", grantedBy: "system" },
    { agentId: marketingManager.id, toolName: "analytics", grantedBy: "system" },
    { agentId: financeAnalyst.id, toolName: "google_sheets", grantedBy: "system" },
    { agentId: financeAnalyst.id, toolName: "quickbooks", grantedBy: "system" },
    { agentId: financeAnalyst.id, toolName: "calculator", grantedBy: "system" },
  ];

  for (const perm of toolPerms) {
    await prisma.toolPermission.upsert({
      where: {
        agentId_toolName: { agentId: perm.agentId, toolName: perm.toolName },
      },
      update: {},
      create: perm,
    });
  }
  console.log(`  ✅ ToolPermissions: ${toolPerms.length} permissions`);

  console.log("🎉 Seed completed!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
