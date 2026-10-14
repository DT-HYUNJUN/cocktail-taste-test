import { describe, expect, it } from "vitest";
import { AssessmentValidationError, transformAssessmentAnswers, validateAssessmentAnswers } from "./index.js";

const base = () => [
  { questionId: "sweet", answerId: "very-low" },
  { questionId: "sour", answerId: "very-high" },
  { questionId: "bitter", answerId: "very-low" },
  { questionId: "alcohol-intensity", answerId: "very-low" },
  { questionId: "refreshing", answerId: "very-high" },
  { questionId: "preferred-flavors", answerIds: ["citrus", "herbal"] },
  { questionId: "avoided-flavors", answerIds: ["smoky"] },
  { questionId: "preferred-base-spirits", answerIds: [] },
];
const modify = (id: string, patch: Record<string, unknown>) => base().map((a) => (a.questionId === id ? { ...a, ...patch } : a));
const invalid = (input: unknown) => expect(() => validateAssessmentAnswers(input)).toThrow(AssessmentValidationError);

describe("Assessment v1", () => {
  it("maps G-001 directly", () => {
    expect(transformAssessmentAnswers(base())).toEqual({
      dimensions: { sweet: 1, sour: 5, bitter: 1, alcoholIntensity: 1, refreshing: 5 },
      preferredFlavors: ["citrus", "herbal"],
      avoidedFlavors: ["smoky"],
      preferredBaseSpirits: [],
    });
  });
  it("preserves unknown as absent and accepts empty selections", () => {
    const input = base().map((a) => ("answerId" in a ? { ...a, answerId: ["sour", "refreshing"].includes(a.questionId) ? a.answerId : "unknown" } : { ...a, answerIds: [] }));
    expect(transformAssessmentAnswers(input)).toEqual({ dimensions: { sour: 5, refreshing: 5 }, preferredFlavors: [], avoidedFlavors: [], preferredBaseSpirits: [] });
  });
  it("is independent of question and multi-select order", () => {
    const a = base();
    const b = [...a].reverse().map((x) => ("answerIds" in x && Array.isArray(x.answerIds) ? { ...x, answerIds: [...x.answerIds].reverse() } : x));
    expect(transformAssessmentAnswers(a)).toEqual(transformAssessmentAnswers(b));
  });
  it("rejects missing, duplicate and unknown questions", () => {
    invalid(base().slice(1));
    invalid([...base().slice(0, 7), base()[0]]);
    invalid(modify("sweet", { questionId: "fake" }));
  });
  it("rejects invalid answer shape and scale ID", () => {
    invalid(modify("sweet", { answerId: "six" }));
    invalid(modify("sweet", { answerIds: ["citrus"] }));
    invalid(modify("preferred-flavors", { answerId: "low" }));
  });
  it("rejects excess choices, duplicates and unknown vocabulary", () => {
    invalid(modify("preferred-flavors", { answerIds: ["citrus", "herbal", "smoky"] }));
    invalid(modify("preferred-base-spirits", { answerIds: ["gin", "gin"] }));
    invalid(modify("avoided-flavors", { answerIds: ["unknown-flavor"] }));
    invalid(modify("preferred-base-spirits", { answerIds: ["gin", "rum", "vodka"] }));
  });
  it("rejects preferred/avoided conflicts", () => {
    invalid(modify("avoided-flavors", { answerIds: ["smoky", "citrus"] }));
  });
  it("accepts all nine avoided flavors when preferred is empty", () => {
    const input = modify("preferred-flavors", { answerIds: [] }).map((a) =>
      a.questionId === "avoided-flavors" ? { ...a, answerIds: ["citrus", "fruity", "tropical", "herbal", "floral", "creamy", "coffee", "spicy", "smoky"] } : a,
    );
    expect(validateAssessmentAnswers(input)).toHaveLength(8);
  });
});
