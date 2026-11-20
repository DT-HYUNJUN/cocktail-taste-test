import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./page";

describe("Home", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
      matches: query.includes("min-width"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("explains the taste test with a single primary heading", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { level: 1, name: /당신의 입맛은 어떤 칵테일\s*일까요\?/ })).toBeVisible();
    expect(screen.getByText(/8가지 질문으로 나만의 한 잔을 발견해 보세요/)).toBeVisible();
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(3);
  });

  it("provides a link to start the taste test", () => {
    render(<Home />);

    const testLinks = screen.getAllByRole("link").filter((link) => link.getAttribute("href") === "/test");

    expect(testLinks.length).toBeGreaterThan(0);
    expect(testLinks[0]).toBeVisible();
    expect(testLinks[0]).toHaveAccessibleName("내 칵테일 찾기");
  });
});
