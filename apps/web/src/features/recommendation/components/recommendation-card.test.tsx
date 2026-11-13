import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RecommendationCard } from "./recommendation-card";

afterEach(cleanup);

describe("RecommendationCard", () => {
  it("shows recommendation reasons and cocktail taste meters beside the image", () => {
    render(
      <RecommendationCard
        item={{
          rank: 1,
          cocktail: {
            id: "margarita",
            name: "Margarita",
            imageUrl: null,
            dimensions: { sweet: 2, sour: 5, bitter: 1, alcoholIntensity: 4, refreshing: 4 },
            flavors: ["citrus"],
            baseSpirits: ["tequila"],
          },
          reasons: [{ type: "core-match", dimensions: ["sour", "refreshing"] }],
        }}
      />,
    );

    const card = screen.getByRole("article");

    expect(within(card).getByRole("heading", { name: "마가리타" })).not.toBeNull();
    expect(within(card).getByRole("img", { name: "마가리타 칵테일" })).not.toBeNull();
    expect(within(card).queryByText("Margarita")).toBeNull();
    expect(within(card).getByText(/테킬라에 라임의 산미와 은은한 단맛을 더한 칵테일이에요/)).not.toBeNull();
    expect(within(card).getByRole("heading", { name: "이 칵테일이 어울리는 이유" })).not.toBeNull();
    expect(within(card).getByText("선호하는 산미·청량감과 잘 어울려요")).not.toBeNull();
    expect(within(card).getByRole("heading", { name: "이 칵테일의 맛" })).not.toBeNull();
    expect(within(card).getAllByRole("meter")).toHaveLength(5);
    expect(within(card).getByRole("meter", { name: "산미 5점" }).getAttribute("aria-valuenow")).toBe("5");
  });
});
