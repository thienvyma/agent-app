/**
 * Tests for Production Deploy modules.
 * Phase 28: Production Deploy.
 *
 * Tests: HealthMonitor logic (service checks, overall status, report formatting).
 */

import {
  checkServiceHealth,
  getOverallHealth,
  formatHealthReport,
  type ServiceCheck,
} from "@/lib/monitoring";

describe("HealthMonitor", () => {
  describe("checkServiceHealth", () => {
    it("should return healthy for successful check", () => {
      const result = checkServiceHealth("database", true, 15);
      expect(result.name).toBe("database");
      expect(result.status).toBe("healthy");
      expect(result.latencyMs).toBe(15);
    });

    it("should return unhealthy for failed check", () => {
      const result = checkServiceHealth("database", false, 0);
      expect(result.status).toBe("unhealthy");
    });

    it("should return degraded for slow response", () => {
      const result = checkServiceHealth("ollama", true, 5500);
      expect(result.status).toBe("degraded");
    });
  });

  describe("getOverallHealth", () => {
    it("should be healthy when all services pass", () => {
      const checks: ServiceCheck[] = [
        { name: "database", status: "healthy", latencyMs: 10 },
        { name: "redis", status: "healthy", latencyMs: 5 },
        { name: "ollama", status: "healthy", latencyMs: 200 },
        { name: "openclaw", status: "healthy", latencyMs: 50 },
      ];

      expect(getOverallHealth(checks)).toBe("healthy");
    });

    it("should be degraded when non-critical service is down", () => {
      const checks: ServiceCheck[] = [
        { name: "database", status: "healthy", latencyMs: 10 },
        { name: "redis", status: "healthy", latencyMs: 5 },
        { name: "ollama", status: "unhealthy", latencyMs: 0 },
        { name: "openclaw", status: "healthy", latencyMs: 50 },
      ];

      expect(getOverallHealth(checks)).toBe("degraded");
    });

    it("should be unhealthy when database is down", () => {
      const checks: ServiceCheck[] = [
        { name: "database", status: "unhealthy", latencyMs: 0 },
        { name: "redis", status: "healthy", latencyMs: 5 },
        { name: "ollama", status: "healthy", latencyMs: 200 },
        { name: "openclaw", status: "healthy", latencyMs: 50 },
      ];

      expect(getOverallHealth(checks)).toBe("unhealthy");
    });
  });

  describe("formatHealthReport", () => {
    it("should format complete health report", () => {
      const checks: ServiceCheck[] = [
        { name: "database", status: "healthy", latencyMs: 10 },
        { name: "redis", status: "healthy", latencyMs: 5 },
        { name: "ollama", status: "healthy", latencyMs: 200 },
        { name: "openclaw", status: "healthy", latencyMs: 50 },
      ];

      const report = formatHealthReport(checks, {
        agentsTotal: 3,
        agentsRunning: 3,
        version: "0.1.0",
      });

      expect(report.status).toBe("healthy");
      expect(report.services).toHaveLength(4);
      expect(report.agents.total).toBe(3);
      expect(report.agents.running).toBe(3);
      expect(report.version).toBe("0.1.0");
      expect(report.timestamp).toBeDefined();
      expect(report.uptime).toBeGreaterThanOrEqual(0);
    });

    it("should include degraded status in report", () => {
      const checks: ServiceCheck[] = [
        { name: "database", status: "healthy", latencyMs: 10 },
        { name: "ollama", status: "degraded", latencyMs: 5500 },
      ];

      const report = formatHealthReport(checks, {
        agentsTotal: 2,
        agentsRunning: 1,
        version: "0.1.0",
      });

      expect(report.status).toBe("degraded");
    });
  });
});
