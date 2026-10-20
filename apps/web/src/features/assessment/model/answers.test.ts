import { describe, expect, it } from "vitest";
import { serializeAssessmentAnswers, type AssessmentAnswers } from "./answers";

const completeAnswers: AssessmentAnswers = {
  sweet: "medium",
  sour: "unknown",
  bitter: "low",
  "alcohol-intensity": "high",
  refreshing: "very-high",
  "preferred-flavors": [],
  "avoided-flavors": [],
  "preferred-base-spirits": [],
};

describe("serializeAssessmentAnswers", () => {
  it("serializes all answers in canonical question order and preserves empty arrays", () => {
    expect(serializeAssessmentAnswers(completeAnswers)).toEqual([
      { questionId: "sweet", answerId: "medium" },
      { questionId: "sour", answerId: "unknown" },
      { questionId: "bitter", answerId: "low" },
      { questionId: "alcohol-intensity", answerId: "high" },
      { questionId: "refreshing", answerId: "very-high" },
      { questionId: "preferred-flavors", answerIds: [] },
      { questionId: "avoided-flavors", answerIds: [] },
      { questionId: "preferred-base-spirits", answerIds: [] },
    ]);
  });

  it("rejects missing and invalid answers", () => {
    expect(serializeAssessmentAnswers({ ...completeAnswers, sweet: undefined })).toBeNull();
    expect(serializeAssessmentAnswers({ ...completeAnswers, sweet: "invalid" })).toBeNull();
    expect(serializeAssessmentAnswers({ ...completeAnswers, "preferred-flavors": ["citrus"], "avoided-flavors": ["citrus"] })).toBeNull();
    expect(serializeAssessmentAnswers({ ...completeAnswers, "preferred-base-spirits": ["gin", "rum", "vodka"] })).toBeNull();
  });
});
