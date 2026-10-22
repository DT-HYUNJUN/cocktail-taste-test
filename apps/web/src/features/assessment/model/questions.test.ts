import { describe, expect, it } from "vitest";
import { ASSESSMENT_QUESTIONS, BASE_SPIRIT_OPTIONS, FLAVOR_OPTIONS, SCALE_ANSWER_IDS } from "./questions";

describe("Assessment v1 question definitions", () => {
  it("uses the eight canonical question IDs in presentation order", () => {
    expect(ASSESSMENT_QUESTIONS.map(({ id }) => id)).toEqual(["sweet", "sour", "bitter", "alcohol-intensity", "refreshing", "preferred-flavors", "avoided-flavors", "preferred-base-spirits"]);
  });

  it("uses canonical answer vocabularies and selection limits", () => {
    expect(ASSESSMENT_QUESTIONS.slice(0, 5).every((question) => question.options.map(({ id }) => id).join() === SCALE_ANSWER_IDS.join())).toBe(true);
    expect(FLAVOR_OPTIONS.map(({ id }) => id)).toEqual(["citrus", "fruity", "tropical", "herbal", "floral", "creamy", "coffee", "spicy", "smoky"]);
    expect(BASE_SPIRIT_OPTIONS.map(({ id }) => id)).toEqual(["gin", "vodka", "rum", "tequila", "whiskey", "mezcal"]);
    expect(ASSESSMENT_QUESTIONS[5].maxSelections).toBe(2);
    expect(ASSESSMENT_QUESTIONS[6].maxSelections).toBeUndefined();
    expect(ASSESSMENT_QUESTIONS[7].maxSelections).toBe(2);
  });
});
