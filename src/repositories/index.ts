/**
 * Repository barrel export.
 * Import all repositories from this file.
 *
 * @module repositories/index
 */

export { getPrisma } from "./base";
export { CompanyRepository } from "./company.repo";
export { AgentRepository } from "./agent.repo";
export { TaskRepository } from "./task.repo";
export { CostRepository } from "./cost.repo";
export { ApprovalRepository } from "./approval.repo";
export { ConversationRepository } from "./conversation.repo";
export { ActivityRepository } from "./activity.repo";
export { CorrectionRepository, ScheduleRepository, TenantRepository } from "./extras.repo";
