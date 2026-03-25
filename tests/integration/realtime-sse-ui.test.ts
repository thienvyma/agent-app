/**
 * S58 — Realtime SSE Dashboard Tests.
 *
 * TDD: Tests written FIRST (Red) → then code → tests PASS (Green).
 *
 * @module tests/integration/realtime-sse-ui
 */

import * as fs from "fs";
import * as path from "path";

// ══════════════════════════════════════════════
// 1. SSE ENDPOINT
// ══════════════════════════════════════════════

describe("S58 Realtime SSE — API Route", () => {
  const ssePath = path.join(
    process.cwd(), "src", "app", "api", "events", "stream", "route.ts"
  );

  it("should have /api/events/stream route file", () => {
    expect(fs.existsSync(ssePath)).toBe(true);
  });

  it("should export GET handler", () => {
    const content = fs.readFileSync(ssePath, "utf-8");
    expect(content).toContain("export async function GET");
  });

  it("should use text/event-stream content type", () => {
    const content = fs.readFileSync(ssePath, "utf-8");
    expect(content).toContain("text/event-stream");
  });

  it("should use ReadableStream for SSE", () => {
    const content = fs.readFileSync(ssePath, "utf-8");
    expect(content).toContain("ReadableStream");
  });
});

// ══════════════════════════════════════════════
// 2. REALTIME FEED COMPONENT
// ══════════════════════════════════════════════

describe("S58 Realtime SSE — Realtime Feed Component", () => {
  const feedPath = path.join(
    process.cwd(), "src", "app", "(dashboard)", "activity", "components", "realtime-feed.tsx"
  );

  it("should have realtime-feed component", () => {
    expect(fs.existsSync(feedPath)).toBe(true);
  });

  it("should use EventSource for SSE connection", () => {
    const content = fs.readFileSync(feedPath, "utf-8");
    expect(content).toContain("EventSource");
  });

  it("should connect to /api/events/stream", () => {
    const content = fs.readFileSync(feedPath, "utf-8");
    expect(content).toContain("/api/events/stream");
  });
});

// ══════════════════════════════════════════════
// 3. ACTIVITY PAGE — LIVE TOGGLE
// ══════════════════════════════════════════════

describe("S58 Realtime SSE — Activity Page Live Toggle", () => {
  const activityPath = path.join(
    process.cwd(), "src", "app", "(dashboard)", "activity", "page.tsx"
  );

  it("should have 'Live' or 'live' mode reference", () => {
    const content = fs.readFileSync(activityPath, "utf-8");
    expect(content.toLowerCase()).toContain("live");
  });

  it("should import RealtimeFeed component", () => {
    const content = fs.readFileSync(activityPath, "utf-8");
    expect(content).toContain("realtime-feed");
  });
});

// ══════════════════════════════════════════════
// 4. REALTIME HUB CORE MODULE
// ══════════════════════════════════════════════

describe("S58 Realtime SSE — RealtimeHub Core", () => {
  it("should export RealtimeHub class", () => {
    const hubPath = path.join(process.cwd(), "src", "core", "realtime", "realtime-hub.ts");
    expect(fs.existsSync(hubPath)).toBe(true);
  });

  it("should have emit method", () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), "src", "core", "realtime", "realtime-hub.ts"),
      "utf-8"
    );
    expect(content).toContain("emit");
  });
});
