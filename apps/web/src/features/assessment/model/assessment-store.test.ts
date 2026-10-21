import { beforeEach, describe, expect, it } from "vitest";
import type { StateStorage } from "zustand/middleware";
import {
  ASSESSMENT_PERSIST_VERSION,
  ASSESSMENT_STORAGE_KEY,
  createAssessmentStore,
  createSafeSessionStorage,
  hydrateAssessmentStore,
} from "./assessment-store";

const createTestStorage = (): StateStorage & { values: Map<string, string> } => {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (name) => values.get(name) ?? null,
    setItem: (name, value) => { values.set(name, value); },
    removeItem: (name) => { values.delete(name); },
  };
};

const persisted = (currentIndex: number, answers: Record<string, unknown>, version = ASSESSMENT_PERSIST_VERSION) =>
  JSON.stringify({ state: { currentIndex, answers }, version });

describe("assessment store", () => {
  let storage: ReturnType<typeof createTestStorage>;

  beforeEach(() => { storage = createTestStorage(); });

  it("stores single answers and supports navigation and revision", () => {
    const store = createAssessmentStore(storage);
    store.getState().selectSingle("sweet", "medium");
    store.getState().moveNext();
    store.getState().movePrevious();
    store.getState().selectSingle("sweet", "high");
    expect(store.getState().currentIndex).toBe(0);
    expect(store.getState().answers.sweet).toBe("high");
  });

  it("enforces multi-select limits and flavor conflicts", () => {
    const store = createAssessmentStore(storage);
    store.getState().toggleMulti("preferred-flavors", "citrus");
    store.getState().toggleMulti("preferred-flavors", "herbal");
    store.getState().toggleMulti("preferred-flavors", "smoky");
    store.getState().toggleMulti("avoided-flavors", "citrus");
    expect(store.getState().answers["preferred-flavors"]).toEqual(["citrus", "herbal"]);
    expect(store.getState().answers["avoided-flavors"]).toBeUndefined();
  });

  it("confirms empty multi-select answers separately from unanswered questions", () => {
    const store = createAssessmentStore(storage);
    expect(store.getState().answers["preferred-flavors"]).toBeUndefined();
    store.getState().confirmEmptyMulti("preferred-flavors");
    store.getState().confirmEmptyMulti("avoided-flavors");
    store.getState().confirmEmptyMulti("preferred-base-spirits");
    expect(store.getState().answers["preferred-flavors"]).toEqual([]);
    expect(store.getState().answers["avoided-flavors"]).toEqual([]);
    expect(store.getState().answers["preferred-base-spirits"]).toEqual([]);
  });

  it("restores persisted state when the store is recreated", async () => {
    const first = createAssessmentStore(storage);
    await hydrateAssessmentStore(first);
    first.getState().selectSingle("sweet", "medium");
    first.getState().moveNext();

    const recreated = createAssessmentStore(storage);
    await hydrateAssessmentStore(recreated);
    expect(recreated.getState().currentIndex).toBe(1);
    expect(recreated.getState().answers.sweet).toBe("medium");
  });

  it.each([
    ["invalid JSON", "{"],
    ["invalid index", persisted(8, {})],
    ["invalid answer ID", persisted(0, { sweet: "invalid" })],
    ["version mismatch", persisted(4, { sweet: "medium" }, ASSESSMENT_PERSIST_VERSION + 1)],
  ])("falls back to initial state for %s", async (_label, value) => {
    storage.values.set(ASSESSMENT_STORAGE_KEY, value);
    const store = createAssessmentStore(storage);
    await hydrateAssessmentStore(store);
    expect(store.getState().currentIndex).toBe(0);
    expect(store.getState().answers).toEqual({});
    expect(store.getState().hasHydrated).toBe(true);
  });

  it("does not overwrite persisted data before explicit hydration", async () => {
    const saved = persisted(3, { sweet: "medium" });
    storage.values.set(ASSESSMENT_STORAGE_KEY, saved);
    const store = createAssessmentStore(storage);
    expect(storage.values.get(ASSESSMENT_STORAGE_KEY)).toBe(saved);
    expect(store.getState().hasHydrated).toBe(false);
    await hydrateAssessmentStore(store);
    expect(store.getState().currentIndex).toBe(3);
  });

  it("continues with memory storage when sessionStorage access fails", async () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, "sessionStorage");
    Object.defineProperty(window, "sessionStorage", { configurable: true, get: () => { throw new Error("blocked"); } });
    try {
      const store = createAssessmentStore(createSafeSessionStorage());
      await hydrateAssessmentStore(store);
      expect(() => store.getState().selectSingle("sweet", "medium")).not.toThrow();
      expect(store.getState().answers.sweet).toBe("medium");
    } finally {
      if (descriptor) Object.defineProperty(window, "sessionStorage", descriptor);
    }
  });

  it("resets persisted and in-memory assessment state", async () => {
    const store = createAssessmentStore(storage);
    await hydrateAssessmentStore(store);
    store.getState().selectSingle("sweet", "medium");
    store.getState().moveNext();
    store.getState().resetAssessment();
    expect(store.getState().currentIndex).toBe(0);
    expect(store.getState().answers).toEqual({});

    const recreated = createAssessmentStore(storage);
    await hydrateAssessmentStore(recreated);
    expect(recreated.getState().currentIndex).toBe(0);
    expect(recreated.getState().answers).toEqual({});
  });
});
