/**
 * @jest-environment jsdom
 */

/**
 * Settings Panels — unit tests for GatewayPanel and ModelsPanel.
 *
 * @module tests/components/settings-panels
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { GatewayPanel } from "@/components/settings/gateway-panel";
import { ModelsPanel } from "@/components/settings/models-panel";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockApiOk(data: unknown = {}) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ data }),
  });
}

describe("GatewayPanel", () => {
  const defaultProps = {
    running: true,
    errors: null as string | null,
    onAction: jest.fn(),
    actionLoading: null as string | null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders status badge: Running", () => {
    render(<GatewayPanel {...defaultProps} />);
    expect(screen.getByText(/running/i)).toBeInTheDocument();
  });

  it("renders status badge: Stopped", () => {
    render(<GatewayPanel {...defaultProps} running={false} />);
    expect(screen.getByText(/stopped/i)).toBeInTheDocument();
  });

  it("shows start/stop/restart buttons", () => {
    render(<GatewayPanel {...defaultProps} />);
    expect(screen.getByText("Start")).toBeInTheDocument();
    expect(screen.getByText("Stop")).toBeInTheDocument();
    expect(screen.getByText("Restart")).toBeInTheDocument();
  });

  it("shows port display", () => {
    render(<GatewayPanel {...defaultProps} port={18789} />);
    expect(screen.getByText(/18789/)).toBeInTheDocument();
  });

  it("shows dashboard link when running", () => {
    render(<GatewayPanel {...defaultProps} port={18789} />);
    const link = screen.getByText(/dashboard/i);
    expect(link).toBeInTheDocument();
  });

  it("shows error message when errors present", () => {
    render(<GatewayPanel {...defaultProps} errors="Connection failed" />);
    expect(screen.getByText(/Connection failed/)).toBeInTheDocument();
  });

  it("calls onAction when start clicked", () => {
    render(<GatewayPanel {...defaultProps} />);
    fireEvent.click(screen.getByText("Start"));
    expect(defaultProps.onAction).toHaveBeenCalledWith("start");
  });
});

describe("ModelsPanel", () => {
  const defaultProps = {
    models: [
      { name: "Qwen3.5-35B-A3B-Coder", input: "text", context: "195k", local: false, auth: true, tags: "default" },
    ],
    currentModel: "ollama-lan/Qwen3.5-35B-A3B-Coder",
    onSetModel: jest.fn(),
    onTestModel: jest.fn(),
    onFetchModels: jest.fn(),
    testResult: null as string | null,
    fetchedModels: [] as string[],
    loading: null as string | null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders model table with model name", () => {
    render(<ModelsPanel {...defaultProps} />);
    expect(screen.getByText("Qwen3.5-35B-A3B-Coder")).toBeInTheDocument();
  });

  it("shows current model badge", () => {
    render(<ModelsPanel {...defaultProps} />);
    expect(screen.getByText(/current/i)).toBeInTheDocument();
  });

  it("has test model button", () => {
    render(<ModelsPanel {...defaultProps} />);
    expect(screen.getByText(/test model/i)).toBeInTheDocument();
  });

  it("has fetch models button", () => {
    render(<ModelsPanel {...defaultProps} />);
    expect(screen.getByText(/fetch/i)).toBeInTheDocument();
  });

  it("shows set model input", () => {
    render(<ModelsPanel {...defaultProps} />);
    expect(screen.getByPlaceholderText(/model/i)).toBeInTheDocument();
  });

  it("calls onSetModel when save clicked", () => {
    render(<ModelsPanel {...defaultProps} />);
    const input = screen.getByPlaceholderText(/model/i);
    fireEvent.change(input, { target: { value: "new-model" } });
    fireEvent.click(screen.getByText(/save/i));
    expect(defaultProps.onSetModel).toHaveBeenCalledWith("new-model");
  });

  it("displays test result when available", () => {
    render(<ModelsPanel {...defaultProps} testResult="Hello! Response ok." />);
    expect(screen.getByText(/Hello! Response ok./)).toBeInTheDocument();
  });
});
