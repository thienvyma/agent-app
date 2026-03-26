/**
 * @jest-environment jsdom
 */

/**
 * ConfigPanel — unit tests for config editor component.
 *
 * @module tests/components/config-panel
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ConfigPanel } from "@/components/settings/config-panel";

describe("ConfigPanel", () => {
  const defaultProps = {
    onGet: jest.fn().mockResolvedValue("test-value"),
    onSet: jest.fn().mockResolvedValue(undefined),
    loading: null as string | null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders quick access section", () => {
    render(<ConfigPanel {...defaultProps} />);
    expect(screen.getByText(/quick access/i)).toBeInTheDocument();
  });

  it("shows common config labels", () => {
    render(<ConfigPanel {...defaultProps} />);
    expect(screen.getByText(/primary model/i)).toBeInTheDocument();
    expect(screen.getByText(/gateway port/i)).toBeInTheDocument();
  });

  it("has config path input", () => {
    render(<ConfigPanel {...defaultProps} />);
    expect(screen.getByPlaceholderText(/config path/i)).toBeInTheDocument();
  });

  it("has value input for set", () => {
    render(<ConfigPanel {...defaultProps} />);
    expect(screen.getByPlaceholderText(/value to set/i)).toBeInTheDocument();
  });

  it("calls onGet when Get button clicked for quick config", async () => {
    render(<ConfigPanel {...defaultProps} />);
    // Click first "Get" button (for Primary Model)
    const getButtons = screen.getAllByText("Get");
    fireEvent.click(getButtons[0]!);

    await waitFor(() => {
      expect(defaultProps.onGet).toHaveBeenCalledWith("agents.defaults.model.primary");
    });
  });

  it("calls onSet when Set is clicked with path and value", async () => {
    render(<ConfigPanel {...defaultProps} />);

    const pathInput = screen.getByPlaceholderText(/config path/i);
    const valueInput = screen.getByPlaceholderText(/value to set/i);
    
    fireEvent.change(pathInput, { target: { value: "gateway.port" } });
    fireEvent.change(valueInput, { target: { value: "18789" } });
    fireEvent.click(screen.getByText("Set"));

    await waitFor(() => {
      expect(defaultProps.onSet).toHaveBeenCalledWith("gateway.port", "18789");
    });
  });

  it("displays result after get", async () => {
    render(<ConfigPanel {...defaultProps} />);
    const getButtons = screen.getAllByText("Get");
    fireEvent.click(getButtons[0]!);

    await waitFor(() => {
      // Result appears in both quick-access display and result section
      expect(screen.getAllByText("test-value").length).toBeGreaterThanOrEqual(1);
    });
  });
});
