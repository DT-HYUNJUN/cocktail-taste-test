import { isRecommendationResponse, type CocktailSummary, type RecommendationItem, type RecommendationReason, type RecommendationResponse, type UserTasteSummary } from "@cocktail-taste-test/contracts";

const MOCK_COCKTAILS = [
  {
    id: "mock-gin-fizz",
    name: "진 피즈",
    imageUrl: "/images/gin-fizz.jpeg",
    dimensions: {
      sweet: 3,
      sour: 4,
      bitter: 1,
      alcoholIntensity: 3,
      refreshing: 5,
    },
    flavors: ["citrus"],
    baseSpirits: ["gin"],
  },
  {
    id: "mock-mojito",
    name: "모히토",
    imageUrl: null,
    dimensions: {
      sweet: 3,
      sour: 3,
      bitter: 1,
      alcoholIntensity: 2,
      refreshing: 5,
    },
    flavors: ["citrus", "herbal"],
    baseSpirits: ["rum"],
  },
  {
    id: "mock-margarita",
    name: "마가리타",
    imageUrl: null,
    dimensions: {
      sweet: 2,
      sour: 4,
      bitter: 2,
      alcoholIntensity: 4,
      refreshing: 3,
    },
    flavors: ["citrus"],
    baseSpirits: ["tequila"],
  },
  {
    id: "mock-whiskey-sour",
    name: "위스키 사워",
    imageUrl: null,
    dimensions: {
      sweet: 3,
      sour: 4,
      bitter: 2,
      alcoholIntensity: 4,
      refreshing: 2,
    },
    flavors: ["citrus"],
    baseSpirits: ["whiskey"],
  },
  {
    id: "mock-espresso-martini",
    name: "에스프레소 마티니",
    imageUrl: null,
    dimensions: {
      sweet: 3,
      sour: 1,
      bitter: 4,
      alcoholIntensity: 4,
      refreshing: 1,
    },
    flavors: ["coffee"],
    baseSpirits: ["vodka"],
  },
] satisfies CocktailSummary[];

function createMockReasons(profile: UserTasteSummary, cocktail: CocktailSummary): RecommendationReason[] {
  const reasons: RecommendationReason[] = [];

  const matchingDimensions = profile.dimensions
    .filter(({ dimension, score }) => Math.abs(score - cocktail.dimensions[dimension]) <= 1)
    .slice(0, 2)
    .map(({ dimension }) => dimension);

  if (matchingDimensions.length > 0) {
    reasons.push({
      type: "core-match",
      dimensions: matchingDimensions,
    });
  }

  const matchingFlavors = profile.preferredFlavors.filter((flavor) => cocktail.flavors.includes(flavor)).slice(0, 2);

  if (matchingFlavors.length > 0) {
    reasons.push({
      type: "flavor-match",
      flavors: matchingFlavors,
    });
  }

  const matchingSpirit = profile.preferredBaseSpirits.find((spirit) => cocktail.baseSpirits.includes(spirit));

  if (matchingSpirit) {
    reasons.push({
      type: "base-spirit-match",
      baseSpirits: [matchingSpirit],
    });
  }

  return reasons;
}

export function createMockRecommendationResponse(profile: UserTasteSummary): RecommendationResponse {
  const recommendations: RecommendationItem[] = MOCK_COCKTAILS.map((cocktail, index) => ({
    rank: index + 1,
    cocktail,
    reasons: createMockReasons(profile, cocktail),
  }));

  const response: RecommendationResponse = {
    profile,
    recommendations,
  };

  if (!isRecommendationResponse(response)) {
    throw new Error("Invalid mock recommendation response");
  }

  return response;
}
