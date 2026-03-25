# Phase 37: Budget & Cost Page (S37)

> /budget — Cost tracking charts, budget limits, alerts.
> Wire: S17-S18 (CostTracker, BudgetManager) + S24 (CostDashboard)

## Tinh nang
1. Budget overview: daily/weekly/monthly charts
2. Per-agent cost breakdown (pie chart)
3. Token usage timeline (line chart)
4. Budget limit setting form
5. Warning alerts (>80% budget)
6. Cost history table with pagination (S24 audit pagination)
7. Export CSV (S24 audit export)

## Charts
- Su dung lightweight chart library (Chart.js hoac Recharts)
- Bar chart: daily cost 7 ngay
- Pie chart: cost per agent
- Line chart: cumulative tokens over time
- Gauge: budget % used

## Files tao moi
1. `src/app/(dashboard)/budget/page.tsx` — Budget dashboard
2. `src/app/(dashboard)/budget/components/cost-chart.tsx`
3. `src/app/(dashboard)/budget/components/budget-form.tsx`
4. `src/app/(dashboard)/budget/components/cost-table.tsx`
5. Update API routes /api/cost → use repository
6. `tests/pages/budget-page.test.ts`
