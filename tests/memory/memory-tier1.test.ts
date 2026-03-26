/**
 * Tests for OpenClaw Memory Tier-1 integration.
 * Session 70: Read MEMORY.md and daily logs from OpenClaw agent directories.
 */

import * as fs from "fs/promises";
import { readAgentMemory, readDailyLogs, getAgentDir } from "@/lib/openclaw-memory";

// Mock fs/promises
jest.mock("fs/promises");

const mockFs = fs as jest.Mocked<typeof fs>;

describe("OpenClaw Memory Tier-1", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAgentDir", () => {
    it("should return correct path for agent", () => {
      const dir = getAgentDir("ceo-001");
      expect(dir).toContain("ceo-001");
      expect(dir).toContain(".openclaw");
      expect(dir).toContain("agents");
    });
  });

  describe("readAgentMemory", () => {
    it("should return MEMORY.md content when file exists", async () => {
      mockFs.readFile.mockResolvedValue(
        "# Agent Memory\n- Công ty thành lập 2024\n- CEO: Nguyễn Văn A"
      );

      const content = await readAgentMemory("ceo-001");

      expect(content).toContain("Agent Memory");
      expect(content).toContain("CEO");
      expect(mockFs.readFile).toHaveBeenCalledWith(
        expect.stringContaining("MEMORY.md"),
        "utf-8"
      );
    });

    it("should return empty string when MEMORY.md not found", async () => {
      const err = new Error("ENOENT") as NodeJS.ErrnoException;
      err.code = "ENOENT";
      mockFs.readFile.mockRejectedValue(err);

      const content = await readAgentMemory("missing-agent");

      expect(content).toBe("");
    });
  });

  describe("readDailyLogs", () => {
    it("should return last N days of daily log content", async () => {
      mockFs.readdir.mockResolvedValue([
        "2026-03-24.md",
        "2026-03-25.md",
        "2026-03-26.md",
      ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

      mockFs.readFile
        .mockResolvedValueOnce("Day 25 log content")
        .mockResolvedValueOnce("Day 26 log content");

      const content = await readDailyLogs("ceo-001", 2);

      expect(content).toContain("Day 25 log content");
      expect(content).toContain("Day 26 log content");
    });

    it("should return empty string when memory directory not found", async () => {
      const err = new Error("ENOENT") as NodeJS.ErrnoException;
      err.code = "ENOENT";
      mockFs.readdir.mockRejectedValue(err);

      const content = await readDailyLogs("missing-agent", 2);

      expect(content).toBe("");
    });
  });
});
