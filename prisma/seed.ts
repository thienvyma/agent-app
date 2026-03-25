/**
 * Prisma seed script — creates sample data for development.
 *
 * Run: npx prisma db seed
 * Or:  npx tsx prisma/seed.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // User (admin)
  const passwordHash = require("bcryptjs").hashSync("admin123", 10);
  const user = await prisma.user.upsert({
    where: { email: "admin@openclaw.dev" },
    update: {
      password: passwordHash,
    },
    create: {
      email: "admin@openclaw.dev",
      password: passwordHash,
      name: "Owner",
      role: "owner",
    },
  });
  console.log("  ✅ User:", user.email);

  // Company
  const company = await prisma.company.upsert({
    where: { id: "seed-company-1" },
    update: {},
    create: {
      id: "seed-company-1",
      name: "OpenClaw Corp",
      description: "AI-powered autonomous business",
      config: { industry: "Technology", size: "startup" },
    },
  });
  console.log("  ✅ Company:", company.name);

  // Departments
  const executive = await prisma.department.create({
    data: { name: "Executive", description: "C-suite leadership", companyId: company.id },
  });
  const marketing = await prisma.department.create({
    data: { name: "Marketing", description: "Growth and content", companyId: company.id },
  });
  const finance = await prisma.department.create({
    data: { name: "Finance", description: "Budget and accounting", companyId: company.id },
  });
  const engineering = await prisma.department.create({
    data: { name: "Engineering", description: "Product development", companyId: company.id },
  });
  console.log("  ✅ Departments: 4 created");

  // Agents
  const ceo = await prisma.agent.create({
    data: {
      name: "CEO Agent",
      role: "CEO",
      sop: "You are the CEO. Delegate tasks, review results, make strategic decisions.",
      model: "qwen2.5:7b",
      tools: ["web_search", "sessions_spawn", "cron", "message"],
      skills: ["strategy", "delegation", "review"],
      departmentId: executive.id,
    },
  });
  const mkt = await prisma.agent.create({
    data: {
      name: "Marketing Agent",
      role: "Marketing Manager",
      sop: "You handle all marketing tasks: content, SEO, social media campaigns.",
      model: "qwen2.5:7b",
      tools: ["web_search", "web_fetch", "image_generate"],
      skills: ["content-writing", "seo", "social-media"],
      departmentId: marketing.id,
    },
  });
  const fin = await prisma.agent.create({
    data: {
      name: "Finance Agent",
      role: "CFO",
      sop: "You handle financial tasks: budgets, ROI calculations, invoicing.",
      model: "qwen2.5:7b",
      tools: ["exec", "web_fetch"],
      skills: ["accounting", "financial-analysis"],
      departmentId: finance.id,
    },
  });
  const dev = await prisma.agent.create({
    data: {
      name: "Developer Agent",
      role: "Tech Lead",
      sop: "You handle technical tasks: coding, deployment, debugging.",
      model: "qwen2.5:7b",
      tools: ["exec", "read", "write", "edit", "browser"],
      skills: ["typescript", "devops", "debugging"],
      departmentId: engineering.id,
    },
  });
  console.log("  ✅ Agents: 4 created");

  // Sample tasks
  await prisma.task.createMany({
    data: [
      { description: "Lập kế hoạch marketing Q2", priority: 8, assignedToId: mkt.id, status: "COMPLETED" },
      { description: "Tính ROI chiến dịch tháng 3", priority: 7, assignedToId: fin.id, status: "IN_PROGRESS" },
      { description: "Review và approve báo giá", priority: 9, assignedToId: ceo.id, status: "WAITING_APPROVAL" },
      { description: "Deploy hotfix auth module", priority: 10, assignedToId: dev.id, status: "COMPLETED" },
      { description: "Viết nội dung blog về AI", priority: 5, assignedToId: mkt.id, status: "PENDING" },
    ],
  });
  console.log("  ✅ Tasks: 5 created");

  // Budget
  const today = new Date().toISOString().split("T")[0]!;
  await prisma.budget.upsert({
    where: { date: today },
    update: {},
    create: { dailyLimit: 100000, warningPct: 80, currentSpent: 0, date: today },
  });
  console.log("  ✅ Budget: daily limit set");

  // Tenant
  await prisma.tenant.upsert({
    where: { slug: "openclaw" },
    update: {},
    create: { name: "OpenClaw Corp", slug: "openclaw", plan: "business", maxAgents: 15, maxTokensPerDay: 1000000, status: "active" },
  });
  console.log("  ✅ Tenant: openclaw created");

  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
