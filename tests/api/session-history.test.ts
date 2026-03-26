/**
 * Session History Sync — TDD tests for Phase 73.
 *
 * Tests that activity and messages routes integrate with
 * OpenClaw session history alongside Prisma data.
 *
 * @module tests/api/session-history
 */

import * as fs from "fs";
import * as path from "path";

const activityRoutePath = path.join(
  process.cwd(), "src", "app", "api", "activity", "route.ts"
);
const messagesRoutePath = path.join(
  process.cwd(), "src", "app", "api", "messages", "route.ts"
);

describe("Session History Sync — Phase 73", () => {
  describe("activity route OpenClaw integration", () => {
    const content = fs.readFileSync(activityRoutePath, "utf-8");

    it("should import execOpenClaw for session data", () => {
      expect(content).toContain("execOpenClaw");
      expect(content).toContain("openclaw-cli");
    });

    it("should fetch OpenClaw sessions list", () => {
      expect(content).toContain("sessions");
    });

    it("should still use Prisma for backward compatibility", () => {
      expect(content).toContain("prisma");
      expect(content).toContain("activityLog");
    });
  });

  describe("messages route OpenClaw integration", () => {
    const content = fs.readFileSync(messagesRoutePath, "utf-8");

    it("should import execOpenClaw for session history", () => {
      expect(content).toContain("execOpenClaw");
      expect(content).toContain("openclaw-cli");
    });

    it("should support source=openclaw query parameter", () => {
      expect(content).toContain("source");
      expect(content).toContain("openclaw");
    });

    it("should still use Prisma for system messages", () => {
      expect(content).toContain("prisma");
      expect(content).toContain("message");
    });
  });
});
