import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CocktailImage } from "./cocktail-image";

afterEach(cleanup);

describe("CocktailImage", () => {
  it("uses the bundled image matching a known cocktail ID", () => {
    render(<CocktailImage cocktailId="mojito" imageUrl={null} name="Mojito" />);

    const image = screen.getByRole("img", { name: "Mojito 칵테일" });

    expect(image.getAttribute("src")).toContain("%2Fcocktails%2Fmojito.png");
    expect(image.className).toContain("object-contain");
    expect(image.className).toContain("md:object-cover");
  });

  it("shows a loading placeholder until the image is ready", async () => {
    render(<CocktailImage cocktailId="mojito" imageUrl={null} name="Mojito" />);

    const image = screen.getByRole("img", { name: "Mojito 칵테일" });

    expect(screen.getByRole("status", { name: "칵테일 이미지 불러오는 중" })).not.toBeNull();

    fireEvent.load(image);

    await waitFor(() => {
      expect(screen.queryByRole("status", { name: "칵테일 이미지 불러오는 중" })).toBeNull();
    });
  });

  it("uses the API image URL for a cocktail without a bundled image", () => {
    render(<CocktailImage cocktailId="seasonal-special" imageUrl="https://example.com/special.webp" name="Seasonal Special" />);

    expect(screen.getByRole("img", { name: "Seasonal Special 칵테일" }).getAttribute("src")).toBe("https://example.com/special.webp");
  });

  it("shows the fallback when the selected image fails to load", () => {
    render(<CocktailImage cocktailId="mojito" imageUrl={null} name="Mojito" />);

    fireEvent.error(screen.getByRole("img", { name: "Mojito 칵테일" }));

    expect(screen.getByRole("img", { name: "Mojito 이미지 준비 중" })).not.toBeNull();
  });

});
