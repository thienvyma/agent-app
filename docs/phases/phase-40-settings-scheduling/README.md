# Phase 40: Settings & Scheduling Page (S40)

> /settings — Company config, tenant, user management.
> /scheduling — Cron jobs, always-on, daily reports.
> Wire: S5 (Company) + S29 (Scheduler) + S30 (Tenant)

## Tinh nang

### /settings
1. Company profile (name, industry)
2. Department management (add/edit/delete)
3. Org chart visualization
4. Tenant management (if multi-tenant enabled)
5. API keys / environment config
6. Notification preferences (Telegram on/off)

### /scheduling
1. Cron job list (S29 ScheduleManager)
2. Add/edit/pause/resume jobs
3. Always-on monitoring (S29 AlwaysOnManager)
4. Agent health status (healthy/stale/crashed)
5. Working hours config
6. Daily report preview + manual trigger

## Files tao moi
1. `src/app/(dashboard)/settings/page.tsx`
2. `src/app/(dashboard)/settings/components/company-form.tsx`
3. `src/app/(dashboard)/settings/components/department-list.tsx`
4. `src/app/(dashboard)/scheduling/page.tsx`
5. `src/app/(dashboard)/scheduling/components/cron-table.tsx`
6. `src/app/(dashboard)/scheduling/components/always-on-monitor.tsx`
7. `tests/pages/settings-page.test.ts`
