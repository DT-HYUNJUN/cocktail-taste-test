import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SessionCocktailImage } from "./session-cocktail-image";

const SESSION_IMAGE_KEY = "cocktail-taste-test:landing-cocktail";

function mockDesktop(desktop: boolean) {
  vi.stubGlobal("matchMedia", vi.fn(() => ({
    matches: desktop,
    media: "(min-width: 768px)",
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })));
}

describe("SessionCocktailImage", () => {
  afterEach(() => {
    cleanup();
    window.sessionStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("does not render an image on mobile", () => {
    mockDesktop(false);
    render(<SessionCocktailImage />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("selects and stores a random image for a desktop session", () => {
    mockDesktop(true);
    vi.spyOn(Math, "random").mockReturnValue(6 / 12);
    render(<SessionCocktailImage />);

    expect(screen.getByRole("img", { name: "모히토 칵테일" })).toBeVisible();
    expect(window.sessionStorage.getItem(SESSION_IMAGE_KEY)).toBe("mojito");
  });

  it("reuses the stored image after remounting", () => {
    mockDesktop(true);
    window.sessionStorage.setItem(SESSION_IMAGE_KEY, "negroni");
    const random = vi.spyOn(Math, "random");

    const firstRender = render(<SessionCocktailImage />);
    expect(screen.getByRole("img", { name: "네그로니 칵테일" })).toBeVisible();
    firstRender.unmount();

    render(<SessionCocktailImage />);
    expect(screen.getByRole("img", { name: "네그로니 칵테일" })).toBeVisible();
    expect(random).not.toHaveBeenCalled();
  });

  it("replaces an invalid stored value with a valid image", () => {
    mockDesktop(true);
    window.sessionStorage.setItem(SESSION_IMAGE_KEY, "unknown-cocktail");
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<SessionCocktailImage />);

    expect(screen.getByRole("img", { name: "아메리카노 칵테일" })).toBeVisible();
    expect(window.sessionStorage.getItem(SESSION_IMAGE_KEY)).toBe("americano");
  });
});
