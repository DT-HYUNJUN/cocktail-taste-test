Status: Accepted
Version: v1
Phase: 1
Last Updated: 2026-10-01

# Golden Cases

Golden cases are executable semantic specifications: `AssessmentAnswer[]` → expected `UserTasteProfile` → ranking invariants and structured reasons. They use versioned fixed cocktail fixtures, not the production dataset, and do not freeze complete score/ranking snapshots.

| ID | Persona | Expected top |
| --- | --- | --- |
| G-001 | Bright & Refreshing | Mojito |
| G-002 | Sweet & Tropical | Piña Colada |
| G-003 | Dry & Spirit-forward | Old Fashioned |
| G-004 | Bitter & Smoky | Americano |
| G-005 | Uncertain Beginner | Tom Collins |

Scores below follow `sweet, sour, bitter, alcoholIntensity, refreshing`.

- **G-001:** `1,5,1,1,5`; prefers citrus/herbal; avoids smoky. Mojito > Tom Collins > Negroni; Margarita > Mezcal Margarita. Mojito: core bitter/refreshing, Flavor citrus/herbal.
- **G-002:** `5,1,1,1,2`; prefers tropical/creamy; avoids coffee; prefers rum. Piña Colada > Tequila Sunrise > Mojito; Piña Colada > Espresso Martini. Piña Colada: core sweet/sour, Flavor tropical/creamy, BaseSpirit rum.
- **G-003:** `1,1,3,5,1`; prefers spicy/whiskey. Old Fashioned > Manhattan > Dry Martini. Reasons: core sour/alcoholIntensity, Flavor spicy, BaseSpirit whiskey.
- **G-004:** `1,1,5,3,3`; prefers herbal/smoky; avoids creamy; prefers gin/mezcal. Americano > Negroni > Mezcal Margarita. Americano: core sour/bitter, Flavor herbal. Do not fabricate smoky/gin/mezcal reasons.
- **G-005:** only sour `4`, refreshing `5`. Tom Collins > Mojito; core reasons sour/refreshing only. Do not create neutral values or Flavor/BaseSpirit reasons without evidence.

## Documentation Gap

Exact Assessment answer IDs and fixed cocktail fixture IDs/profiles are absent. These are canonical semantic cases but cannot yet become complete executable fixtures.

## GOLDEN-001 — Change policy

Never update a Golden expectation merely to match implementation output. First investigate a bug; if behavior intentionally changes, update the canonical domain decision, record the reason, then update the Golden expectation.
