import { describe, expect, it } from "vitest";

import type { CocktailProfile, UserTasteProfile } from "../profile/index.js";
import { buildRecommendationResult } from "../recommendation-result/index.js";

type Scores = [number, number, number, number, number];

function cocktail(id: string, name: string, scores: Scores, flavors: CocktailProfile["flavors"], baseSpirits: CocktailProfile["baseSpirits"]): CocktailProfile {
  const [sweet, sour, bitter, alcoholIntensity, refreshing] = scores;

  return {
    id,
    name,
    dimensions: {
      sweet,
      sour,
      bitter,
      alcoholIntensity,
      refreshing,
    } as CocktailProfile["dimensions"],
    flavors,
    baseSpirits,
  };
}

// P3-05-02 Draft 데이터를 옮긴 시뮬레이션 전용 후보.
// 아직 실제 운영 Seed로 사용하지 않는다.
const candidates: CocktailProfile[] = [
  cocktail("mojito", "Mojito", [3, 4, 1, 2, 5], ["citrus", "herbal"], ["rum"]),
  cocktail("tom-collins", "Tom Collins", [3, 4, 1, 2, 5], ["citrus"], ["gin"]),
  cocktail("negroni", "Negroni", [3, 1, 5, 4, 2], ["herbal"], ["gin"]),
  cocktail("margarita", "Margarita", [2, 5, 1, 4, 4], ["citrus"], ["tequila"]),
  cocktail("mezcal-margarita", "Mezcal Margarita", [3, 5, 1, 4, 4], ["citrus", "smoky"], ["mezcal"]),
  cocktail("pina-colada", "Piña Colada", [5, 1, 1, 2, 3], ["tropical", "fruity", "creamy"], ["rum"]),
  cocktail("tequila-sunrise", "Tequila Sunrise", [4, 2, 1, 2, 3], ["citrus", "fruity"], ["tequila"]),
  cocktail("espresso-martini", "Espresso Martini", [3, 1, 3, 4, 1], ["coffee"], ["vodka"]),
  cocktail("old-fashioned", "Old Fashioned", [2, 1, 3, 5, 1], [], ["whiskey"]),
  cocktail("manhattan", "Manhattan", [3, 1, 3, 5, 1], ["herbal"], ["whiskey"]),
  cocktail("dry-martini", "Dry Martini", [1, 1, 2, 5, 1], ["herbal"], ["gin"]),
  cocktail("americano", "Americano", [3, 1, 4, 2, 4], ["herbal"], []),
];

function profile(overrides: Partial<UserTasteProfile> = {}): UserTasteProfile {
  return {
    dimensions: {},
    preferredFlavors: [],
    avoidedFlavors: [],
    preferredBaseSpirits: [],
    ...overrides,
  };
}

const scenarios = [
  {
    name: "상큼하고 청량한 취향 / Rum 선호",
    user: profile({
      dimensions: {
        sweet: 3,
        sour: 4,
        bitter: 1,
        alcoholIntensity: 2,
        refreshing: 5,
      },
      preferredFlavors: ["citrus", "herbal"],
      preferredBaseSpirits: ["rum"],
    }),
  },
  {
    name: "상큼하고 청량한 취향 / Gin 선호",
    user: profile({
      dimensions: {
        sweet: 3,
        sour: 4,
        bitter: 1,
        alcoholIntensity: 2,
        refreshing: 5,
      },
      preferredFlavors: ["citrus"],
      preferredBaseSpirits: ["gin"],
    }),
  },
  {
    name: "스모키한 Margarita 취향",
    user: profile({
      dimensions: {
        sweet: 3,
        sour: 5,
        bitter: 1,
        alcoholIntensity: 4,
        refreshing: 4,
      },
      preferredFlavors: ["smoky", "citrus"],
      preferredBaseSpirits: ["mezcal"],
    }),
  },
  {
    name: "쓴맛과 허브향 선호",
    user: profile({
      dimensions: {
        sweet: 3,
        sour: 1,
        bitter: 5,
        alcoholIntensity: 4,
        refreshing: 2,
      },
      preferredFlavors: ["herbal"],
      preferredBaseSpirits: ["gin"],
    }),
  },
  {
    name: "달콤하고 부드러운 취향",
    user: profile({
      dimensions: {
        sweet: 5,
        sour: 1,
        bitter: 1,
        alcoholIntensity: 2,
        refreshing: 3,
      },
      preferredFlavors: ["tropical", "creamy"],
      preferredBaseSpirits: ["rum"],
    }),
  },
  {
    name: "강한 위스키 취향",
    user: profile({
      dimensions: {
        sweet: 2,
        sour: 1,
        bitter: 3,
        alcoholIntensity: 5,
        refreshing: 1,
      },
      preferredBaseSpirits: ["whiskey"],
    }),
  },
] satisfies {
  name: string;
  user: UserTasteProfile;
}[];

describe("Cocktail Dataset Draft Simulation", () => {
  it("12개 후보 ID가 고유하다", () => {
    expect(candidates).toHaveLength(12);
    expect(new Set(candidates.map((c) => c.id)).size).toBe(12);
  });

  it.each(scenarios)("$name 추천 결과를 생성한다", ({ name, user }) => {
    const result = buildRecommendationResult(user, candidates);

    expect(result.recommendations).toHaveLength(12);

    const top5 = result.recommendations.slice(0, 5);

    console.log(`\n[${name}]`);
    console.table(
      top5.map((item) => ({
        rank: item.rank,
        id: item.cocktail.id,
        name: item.cocktail.name,
      })),
    );

    expect(top5).toHaveLength(5);
    expect(new Set(top5.map((item) => item.cocktail.id)).size).toBe(5);
  });

  it("후보 입력 순서가 달라도 추천 순위가 동일하다", () => {
    for (const { user } of scenarios) {
      const original = buildRecommendationResult(user, candidates);
      const reversed = buildRecommendationResult(user, [...candidates].reverse());

      expect(original.recommendations.map((item) => item.cocktail.id)).toEqual(reversed.recommendations.map((item) => item.cocktail.id));
    }
  });
});

it("대표 취향별 예상 1위가 유지된다", () => {
  const expectedTopIds = ["mojito", "tom-collins", "mezcal-margarita", "negroni", "pina-colada", "old-fashioned"];

  scenarios.forEach(({ user }, index) => {
    const result = buildRecommendationResult(user, candidates);

    expect(result.recommendations[0]?.cocktail.id).toBe(expectedTopIds[index]);
  });
});
