import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import RootPage from "./page";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TMS_PROJECT_STORAGE_KEY } from "../lib/utils";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn(() => ""),
}));

describe("RootPage (Redirect to Dashboard)", () => {
  const mockReplace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(useRouter).mockReturnValue({
      replace: mockReplace,
      push: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
  });

  it("should render redirection indicator and redirect to /dashboard when no query params", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("") as unknown as ReturnType<typeof useSearchParams>,
    );

    render(<RootPage />);

    expect(
      screen.getByText("Redirection vers le tableau de bord..."),
    ).toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
  });

  it("should fallback to stored project when no query param is present", () => {
    localStorage.setItem(TMS_PROJECT_STORAGE_KEY, "wse");
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("") as unknown as ReturnType<typeof useSearchParams>,
    );

    render(<RootPage />);

    expect(mockReplace).toHaveBeenCalledWith("/dashboard?project=wse");
  });

  it("should clean project=all from query parameters", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("project=all") as unknown as ReturnType<
        typeof useSearchParams
      >,
    );

    render(<RootPage />);

    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
  });

  it("should preserve query parameters when redirecting to /dashboard", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("project=wse&env=staging") as unknown as ReturnType<
        typeof useSearchParams
      >,
    );

    render(<RootPage />);

    expect(mockReplace).toHaveBeenCalledWith("/dashboard?project=wse&env=staging");
  });
});

