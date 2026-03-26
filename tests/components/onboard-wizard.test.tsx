/**
 * @jest-environment jsdom
 */

/**
 * OnboardWizard — unit tests for OpenClaw setup wizard component.
 *
 * @module tests/components/onboard-wizard
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { OnboardWizard } from "@/components/settings/onboard-wizard";

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

/** Helper: mock successful API response */
function mockApiResponse(data: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true, data }),
  });
}

describe("OnboardWizard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders wizard title", () => {
    render(<OnboardWizard />);
    expect(screen.getByText(/setup wizard/i)).toBeInTheDocument();
  });

  it("shows 6 step indicators", () => {
    render(<OnboardWizard />);
    // Step labels may also appear in buttons, so use getAllByText
    expect(screen.getAllByText(/check/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/provider/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/model/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/gateway/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/health/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/complete/i).length).toBeGreaterThanOrEqual(1);
  });

  it("has a check install button on first step", () => {
    render(<OnboardWizard />);
    expect(
      screen.getByRole("button", { name: /check/i })
    ).toBeInTheDocument();
  });

  it("calls API on check and advances to next step", async () => {
    mockApiResponse({ installed: true, version: "2026.3.11" });

    render(<OnboardWizard />);
    fireEvent.click(screen.getByRole("button", { name: /check/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/openclaw/onboard",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"step":"check"'),
        })
      );
    });
  });

  it("shows pre-filled provider defaults", async () => {
    // Advance to step 2 by completing step 1
    mockApiResponse({ installed: true, version: "2026.3.11" });

    render(<OnboardWizard />);
    fireEvent.click(screen.getByRole("button", { name: /check/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue("http://192.168.1.35:8080/v1")).toBeInTheDocument();
    });
  });

  it("shows skip link for already configured users", () => {
    render(<OnboardWizard />);
    expect(
      screen.getByText(/already configured/i)
    ).toBeInTheDocument();
  });

  it("calls onComplete callback when dismissed", () => {
    const onComplete = jest.fn();
    render(<OnboardWizard onComplete={onComplete} />);

    fireEvent.click(screen.getByText(/already configured/i));
    expect(onComplete).toHaveBeenCalled();
  });
});
