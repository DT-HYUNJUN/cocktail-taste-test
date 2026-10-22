import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { validatePartialAssessmentAnswers, type AssessmentAnswers } from "./answers";
import {
  ASSESSMENT_QUESTIONS,
  type CoreQuestionId,
  type MultiQuestionId,
  type ScaleAnswerId,
} from "./questions";

export const ASSESSMENT_STORAGE_KEY = "cocktail-taste-test:assessment";
export const ASSESSMENT_PERSIST_VERSION = 1;
const LAST_QUESTION_INDEX = ASSESSMENT_QUESTIONS.length - 1;

type PersistedAssessmentState = Pick<AssessmentStoreState, "currentIndex" | "answers">;

export type AssessmentStoreState = {
  currentIndex: number;
  answers: AssessmentAnswers;
  hasHydrated: boolean;
  selectSingle: (questionId: CoreQuestionId, answerId: ScaleAnswerId) => void;
  toggleMulti: (questionId: MultiQuestionId, answerId: string) => void;
  confirmEmptyMulti: (questionId: MultiQuestionId) => void;
  moveNext: () => void;
  movePrevious: () => void;
  returnToLastQuestion: () => void;
  resetAssessment: () => void;
  setHasHydrated: (value: boolean) => void;
};

const initialPersistedState: PersistedAssessmentState = { currentIndex: 0, answers: {} };

const createMemoryStorage = (): StateStorage => {
  const values = new Map<string, string>();
  return {
    getItem: (name) => values.get(name) ?? null,
    setItem: (name, value) => { values.set(name, value); },
    removeItem: (name) => { values.delete(name); },
  };
};

export function createSafeSessionStorage(): StateStorage {
  const fallback = createMemoryStorage();
  const session = (() => {
    try {
      return typeof window === "undefined" ? null : window.sessionStorage;
    } catch {
      return null;
    }
  })();
  if (session === null) return fallback;
  return {
    getItem: (name) => {
      try { return session.getItem(name); } catch { return fallback.getItem(name); }
    },
    setItem: (name, value) => {
      try { session.setItem(name, value); } catch { fallback.setItem(name, value); }
    },
    removeItem: (name) => {
      try { session.removeItem(name); } catch { fallback.removeItem(name); }
    },
  };
}

export function validatePersistedAssessmentState(value: unknown): PersistedAssessmentState | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (!Number.isInteger(candidate.currentIndex) || (candidate.currentIndex as number) < 0 || (candidate.currentIndex as number) > LAST_QUESTION_INDEX) return null;
  const answers = validatePartialAssessmentAnswers(candidate.answers);
  return answers === null ? null : { currentIndex: candidate.currentIndex as number, answers };
}

export function createAssessmentStore(storage: StateStorage = createSafeSessionStorage()) {
  return create<AssessmentStoreState>()(persist(
    (set) => ({
      ...initialPersistedState,
      hasHydrated: false,
      selectSingle: (questionId, answerId) => set((state) => {
        const question = ASSESSMENT_QUESTIONS.find(({ id }) => id === questionId);
        if (question?.kind !== "single" || !question.options.some(({ id }) => id === answerId)) return state;
        return { answers: { ...state.answers, [questionId]: answerId } };
      }),
      toggleMulti: (questionId, answerId) => set((state) => {
        const question = ASSESSMENT_QUESTIONS.find(({ id }) => id === questionId);
        if (question?.kind !== "multi" || !question.options.some(({ id }) => id === answerId)) return state;
        const current: string[] = [...(state.answers[questionId] ?? [])];
        const next = current.includes(answerId) ? current.filter((item) => item !== answerId) : [...current, answerId];
        if (question.maxSelections !== undefined && next.length > question.maxSelections) return state;
        const conflictId = questionId === "preferred-flavors" ? "avoided-flavors" : questionId === "avoided-flavors" ? "preferred-flavors" : null;
        const conflicts: readonly string[] = conflictId === null ? [] : (state.answers[conflictId] ?? []);
        if (!current.includes(answerId) && conflicts.includes(answerId)) return state;
        return { answers: { ...state.answers, [questionId]: next } as AssessmentAnswers };
      }),
      confirmEmptyMulti: (questionId) => set((state) => {
        if (state.answers[questionId] !== undefined) return state;
        return { answers: { ...state.answers, [questionId]: [] } as AssessmentAnswers };
      }),
      moveNext: () => set((state) => ({ currentIndex: Math.min(LAST_QUESTION_INDEX, state.currentIndex + 1) })),
      movePrevious: () => set((state) => ({ currentIndex: Math.max(0, state.currentIndex - 1) })),
      returnToLastQuestion: () => set({ currentIndex: LAST_QUESTION_INDEX }),
      resetAssessment: () => set({ ...initialPersistedState }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: ASSESSMENT_STORAGE_KEY,
      version: ASSESSMENT_PERSIST_VERSION,
      migrate: () => initialPersistedState,
      storage: createJSONStorage(() => storage),
      skipHydration: true,
      partialize: ({ currentIndex, answers }) => ({ currentIndex, answers }),
      merge: (persisted, current) => {
        const restored = validatePersistedAssessmentState(persisted);
        return restored === null ? { ...current, ...initialPersistedState } : { ...current, ...restored };
      },
    },
  ));
}

export const useAssessmentStore = createAssessmentStore();

export async function hydrateAssessmentStore(store = useAssessmentStore): Promise<void> {
  try {
    await store.persist.rehydrate();
  } catch {
    store.setState(initialPersistedState);
  } finally {
    store.getState().setHasHydrated(true);
  }
}
