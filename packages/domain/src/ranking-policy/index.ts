import type { RecommendationMatch } from '../recommendation-match/index.js';

export const MAX_CLOSE_CORE_DISTANCE_GAP = 1 as const;

export type SemanticRelation = 'dominates' | 'dominated' | 'tie' | 'incomparable';
export type RankedRecommendation = { match: RecommendationMatch; semanticLayer: number; presentationRank: number };

type Evidence = { core: number; flavor: number; avoided: number; spirit: number };
const evidence = (match: RecommendationMatch): Evidence => ({
  core: match.totalCoreDistance,
  flavor: match.preferredFlavorMatches.length,
  avoided: match.avoidedFlavorCollisions.length,
  spirit: match.preferredBaseSpiritMatches.length,
});

/** Semantic relation of A to B. Presentation order is intentionally excluded. */
export function compareRecommendationMatches(a: RecommendationMatch, b: RecommendationMatch): SemanticRelation {
  const x = evidence(a);
  const y = evidence(b);
  const gap = Math.abs(x.core - y.core);
  if (gap > MAX_CLOSE_CORE_DISTANCE_GAP) return x.core < y.core ? 'dominates' : 'dominated';
  const aNotWorse = x.core <= y.core && x.flavor >= y.flavor && x.avoided <= y.avoided && x.spirit >= y.spirit;
  const bNotWorse = y.core <= x.core && y.flavor >= x.flavor && y.avoided <= x.avoided && y.spirit >= x.spirit;
  if (aNotWorse && bNotWorse) return 'tie';
  if (aNotWorse) return 'dominates';
  if (bNotWorse) return 'dominated';
  return 'incomparable';
}

/** Successive non-dominated layers, with deterministic technical order inside each layer. */
export function rankRecommendationMatches(matches: readonly RecommendationMatch[]): RankedRecommendation[] {
  const ids = new Set<string>();
  for (const match of matches) {
    if (ids.has(match.cocktailId)) throw new Error(`Duplicate cocktail ID: ${match.cocktailId}`);
    ids.add(match.cocktailId);
  }
  let remaining = [...matches];
  const result: RankedRecommendation[] = [];
  let layer = 1;
  while (remaining.length > 0) {
    const nonDominated = remaining.filter(candidate => !remaining.some(other =>
      other !== candidate && compareRecommendationMatches(other, candidate) === 'dominates',
    ));
    if (nonDominated.length === 0) {
      throw new Error('No non-dominated candidates; semantic dominance cycle detected');
    }
    nonDominated.sort((a, b) => a.totalCoreDistance - b.totalCoreDistance ||
      (a.cocktailId < b.cocktailId ? -1 : a.cocktailId > b.cocktailId ? 1 : 0));
    for (const match of nonDominated) {
      result.push({ match, semanticLayer: layer, presentationRank: result.length + 1 });
    }
    const selected = new Set(nonDominated);
    remaining = remaining.filter(match => !selected.has(match));
    layer++;
  }
  return result;
}
