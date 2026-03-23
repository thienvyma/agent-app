import { formatOutput, OutputFormat } from "@/cli/utils/output";
import { getStatusData, StatusData } from "@/cli/commands/status";

describe("ae status", () => {
  describe("getStatusData", () => {
    it("should return StatusData with all required fields", async () => {
      const data = await getStatusData();

      expect(data).toHaveProperty("version");
      expect(data).toHaveProperty("agents");
      expect(data).toHaveProperty("tasks");
      expect(data).toHaveProperty("services");
      expect(data).toHaveProperty("uptime");
    });

    it("should return correct agent counts structure", async () => {
      const data = await getStatusData();

      expect(data.agents).toEqual(
        expect.objectContaining({
          total: expect.any(Number),
          active: expect.any(Number),
          idle: expect.any(Number),
          error: expect.any(Number),
        })
      );
    });

    it("should return correct task counts structure", async () => {
      const data = await getStatusData();

      expect(data.tasks).toEqual(
        expect.objectContaining({
          total: expect.any(Number),
          pending: expect.any(Number),
          running: expect.any(Number),
          completed: expect.any(Number),
        })
      );
    });

    it("should return service status strings", async () => {
      const data = await getStatusData();

      expect(typeof data.services.postgresql).toBe("string");
      expect(typeof data.services.redis).toBe("string");
      expect(typeof data.services.openclaw).toBe("string");
      expect(typeof data.services.ollama).toBe("string");
    });
  });

  describe("formatOutput", () => {
    const mockData: StatusData = {
      version: "0.1.0",
      agents: { total: 5, active: 3, idle: 1, error: 1 },
      tasks: { total: 10, pending: 2, running: 3, completed: 5 },
      services: {
        postgresql: "connected",
        redis: "connected",
        openclaw: "disconnected",
        ollama: "disconnected",
      },
      uptime: "0h 0m",
    };

    it("should output valid JSON when format is json", () => {
      const output = formatOutput(mockData, "json");
      const parsed = JSON.parse(output);

      expect(parsed.version).toBe("0.1.0");
      expect(parsed.agents.total).toBe(5);
    });

    it("should output readable table when format is table", () => {
      const output = formatOutput(mockData, "table");

      expect(output).toContain("Agentic Enterprise");
      expect(output).toContain("0.1.0");
      expect(output).toContain("connected");
    });

    it("should default to json format", () => {
      const output = formatOutput(mockData);
      expect(() => JSON.parse(output)).not.toThrow();
    });
  });
});
