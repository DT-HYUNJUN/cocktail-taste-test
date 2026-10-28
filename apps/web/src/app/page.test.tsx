import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home", () => {
  it("provides a link to start the taste test", () => {
    render(<Home />);

    const testLinks = screen.getAllByRole("link").filter((link) => link.getAttribute("href") === "/test");

    expect(testLinks.length).toBeGreaterThan(0);
    expect(testLinks[0]).toBeVisible();
    expect(testLinks[0]).toHaveAccessibleName();
  });
});
