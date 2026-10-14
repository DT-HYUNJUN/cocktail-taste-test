import type { AssessmentAnswer } from '../assessment/index.js';
import type { CocktailProfile, UserTasteProfile } from '../profile/index.js';

/** Canonical Golden Cocktail Fixtures v1: fixed evidence, never backsolved from assertions. */
const core = (sweet: 1|2|3|4|5, sour: 1|2|3|4|5, bitter: 1|2|3|4|5, alcoholIntensity: 1|2|3|4|5, refreshing: 1|2|3|4|5) =>
  ({ sweet, sour, bitter, alcoholIntensity, refreshing });
export const GOLDEN_COCKTAILS: readonly CocktailProfile[] = [
  { id: 'mojito', name: 'Mojito', dimensions: core(3,4,1,2,5), flavors: ['citrus','herbal'], baseSpirits: ['rum'] },
  { id: 'tom-collins', name: 'Tom Collins', dimensions: core(3,4,1,2,5), flavors: ['citrus'], baseSpirits: ['gin'] },
  { id: 'negroni', name: 'Negroni', dimensions: core(2,1,5,4,2), flavors: ['herbal'], baseSpirits: ['gin'] },
  { id: 'margarita', name: 'Margarita', dimensions: core(2,5,1,3,4), flavors: ['citrus'], baseSpirits: ['tequila'] },
  { id: 'mezcal-margarita', name: 'Mezcal Margarita', dimensions: core(2,5,1,3,4), flavors: ['citrus','smoky'], baseSpirits: ['mezcal'] },
  { id: 'pina-colada', name: 'Piña Colada', dimensions: core(5,2,1,2,3), flavors: ['tropical','creamy'], baseSpirits: ['rum'] },
  { id: 'tequila-sunrise', name: 'Tequila Sunrise', dimensions: core(4,2,1,2,3), flavors: ['fruity'], baseSpirits: ['tequila'] },
  { id: 'espresso-martini', name: 'Espresso Martini', dimensions: core(3,1,3,4,1), flavors: ['coffee'], baseSpirits: ['vodka'] },
  { id: 'old-fashioned', name: 'Old Fashioned', dimensions: core(2,1,3,5,1), flavors: ['spicy'], baseSpirits: ['whiskey'] },
  { id: 'manhattan', name: 'Manhattan', dimensions: core(3,1,2,4,1), flavors: ['spicy'], baseSpirits: ['whiskey'] },
  { id: 'dry-martini', name: 'Dry Martini', dimensions: core(1,1,1,5,2), flavors: ['herbal'], baseSpirits: ['gin'] },
  { id: 'americano', name: 'Americano', dimensions: core(2,1,5,2,4), flavors: ['herbal'], baseSpirits: [] },
];

type GoldenId = 'G-001' | 'G-002' | 'G-003' | 'G-004' | 'G-005';
type CoreAnswer = 'very-low'|'low'|'medium'|'high'|'very-high'|'unknown';
const answers = (scale: readonly [CoreAnswer,CoreAnswer,CoreAnswer,CoreAnswer,CoreAnswer], preferred: string[], avoided: string[], spirits: string[]): AssessmentAnswer[] => [
  { questionId:'sweet', answerId:scale[0] },
  { questionId:'sour', answerId:scale[1] },
  { questionId:'bitter', answerId:scale[2] },
  { questionId:'alcohol-intensity', answerId:scale[3] },
  { questionId:'refreshing', answerId:scale[4] },
  { questionId:'preferred-flavors', answerIds:preferred },
  { questionId:'avoided-flavors', answerIds:avoided },
  { questionId:'preferred-base-spirits', answerIds:spirits },
];
export const GOLDEN_PERSONAS: Record<GoldenId, { answers: AssessmentAnswer[]; profile: UserTasteProfile }> = {
  'G-001': { answers:answers(['very-low','very-high','very-low','very-low','very-high'],['citrus','herbal'],['smoky'],[]), profile:{dimensions:core(1,5,1,1,5),preferredFlavors:['citrus','herbal'],avoidedFlavors:['smoky'],preferredBaseSpirits:[]} },
  'G-002': { answers:answers(['very-high','very-low','very-low','very-low','low'],['tropical','creamy'],['coffee'],['rum']), profile:{dimensions:core(5,1,1,1,2),preferredFlavors:['tropical','creamy'],avoidedFlavors:['coffee'],preferredBaseSpirits:['rum']} },
  'G-003': { answers:answers(['very-low','very-low','medium','very-high','very-low'],['spicy'],[],['whiskey']), profile:{dimensions:core(1,1,3,5,1),preferredFlavors:['spicy'],avoidedFlavors:[],preferredBaseSpirits:['whiskey']} },
  'G-004': { answers:answers(['very-low','very-low','very-high','medium','medium'],['herbal','smoky'],['creamy'],['gin','mezcal']), profile:{dimensions:core(1,1,5,3,3),preferredFlavors:['herbal','smoky'],avoidedFlavors:['creamy'],preferredBaseSpirits:['gin','mezcal']} },
  'G-005': { answers:answers(['unknown','high','unknown','unknown','very-high'],[],[],[]), profile:{dimensions:{sour:4,refreshing:5},preferredFlavors:[],avoidedFlavors:[],preferredBaseSpirits:[]} },
};
