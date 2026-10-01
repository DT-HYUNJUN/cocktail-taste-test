import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home", () => {
  it("renders the primary taste-test call to action", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name: "테스트 시작하기" })).toBeVisible();
  });
});
