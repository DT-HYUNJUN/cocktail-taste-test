import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAssessmentStore } from "../model/assessment-store";
import { Assessment } from "./assessment";

afterEach(cleanup);
beforeEach(() => {
  sessionStorage.clear();
  useAssessmentStore.setState({ currentIndex: 0, answers: {}, hasHydrated: false });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
    profile: { dimensions: [], preferredFlavors: [], avoidedFlavors: [], preferredBaseSpirits: [] },
    recommendations: [],
  }), { status: 200 })));
});

const advanceToPreferredFlavors = () => {
  for (let question = 0; question < 5; question += 1) {
    fireEvent.click(screen.getByRole("radio", { name: "잘 모르겠어요" }));
    fireEvent.click(screen.getByRole("button", { name: "다음 질문" }));
  }
};

const completeAssessment = () => {
  advanceToPreferredFlavors();
  fireEvent.click(screen.getByRole("button", { name: "다음 질문" }));
  fireEvent.click(screen.getByRole("button", { name: "다음 질문" }));
};

const renderAssessment = async () => {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(<QueryClientProvider client={queryClient}><Assessment /></QueryClientProvider>);
  await screen.findByRole("heading", { name: "칵테일의 단맛은 어느 정도가 좋아요?" });
};

describe("Assessment", () => {
  it("moves from Q1 to Q2 only after medium is selected and next is clicked", async () => {
    await renderAssessment();
    const next = screen.getByRole("button", { name: "다음 질문" });
    expect(next).toBeDisabled();
    fireEvent.click(screen.getByRole("radio", { name: "적당히 달콤한 게 좋아요" }));
    expect(screen.getByRole("heading", { name: "칵테일의 단맛은 어느 정도가 좋아요?" })).toBeVisible();
    fireEvent.click(next);
    expect(screen.getByRole("heading", { name: "새콤한 맛은 어느 정도가 좋아요?" })).toBeVisible();
    expect(screen.getByLabelText("질문 2 / 8")).toBeVisible();
  });

  it("keeps an existing selection when returning to a previous question", async () => {
    await renderAssessment();
    fireEvent.click(screen.getByRole("radio", { name: "적당히 달콤한 게 좋아요" }));
    fireEvent.click(screen.getByRole("button", { name: "다음 질문" }));
    fireEvent.click(screen.getByRole("button", { name: "이전 질문" }));
    expect(screen.getByRole("radio", { name: "적당히 달콤한 게 좋아요" })).toBeChecked();
  });

  it("keeps a revised answer after moving forward and back again", async () => {
    await renderAssessment();
    fireEvent.click(screen.getByRole("radio", { name: "적당히 달콤한 게 좋아요" }));
    fireEvent.click(screen.getByRole("button", { name: "다음 질문" }));
    fireEvent.click(screen.getByRole("button", { name: "이전 질문" }));
    fireEvent.click(screen.getByRole("radio", { name: "꽤 달콤한 게 좋아요" }));
    fireEvent.click(screen.getByRole("button", { name: "다음 질문" }));
    fireEvent.click(screen.getByRole("button", { name: "이전 질문" }));
    expect(screen.getByRole("radio", { name: "꽤 달콤한 게 좋아요" })).toBeChecked();
  });

  it("enforces multi-select limits and prevents preferred and avoided flavor overlap", async () => {
    await renderAssessment();
    advanceToPreferredFlavors();

    fireEvent.click(screen.getByRole("checkbox", { name: "레몬·라임처럼 상큼한 시트러스" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "민트·허브처럼 싱그러운 향" }));
    expect(screen.getByRole("checkbox", { name: /훈연향이 느껴지는 스모키한 풍미/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "다음 질문" }));

    expect(screen.getByRole("checkbox", { name: /레몬·라임처럼 상큼한 시트러스/ })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "훈연향이 느껴지는 스모키한 풍미" })).not.toBeDisabled();
  });

  it("confirms empty multi-select answers and completes all eight questions", async () => {
    await renderAssessment();
    completeAssessment();

    expect(screen.getByRole("button", { name: "결과 확인하기" })).toBeEnabled();
    expect(screen.getByText("0/2개 선택됨")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "결과 확인하기" }));
    expect(await screen.findByRole("heading", { name: "추천 결과를 받았어요" })).toBeVisible();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("returns from completion to Q8 with the existing answer", async () => {
    await renderAssessment();
    completeAssessment();
    fireEvent.click(screen.getByRole("checkbox", { name: "gin" }));
    fireEvent.click(screen.getByRole("button", { name: "결과 확인하기" }));
    fireEvent.click(await screen.findByRole("button", { name: "답변 수정하기" }));

    expect(await screen.findByLabelText("질문 8 / 8")).toBeVisible();
    expect(screen.getByRole("checkbox", { name: "gin" })).toBeChecked();
  });

  it("shows pending state, prevents duplicate submission, and sends canonical answers", async () => {
    let resolveRequest!: (response: Response) => void;
    vi.mocked(fetch).mockImplementation(() => new Promise((resolve) => { resolveRequest = resolve; }));
    await renderAssessment();
    completeAssessment();
    fireEvent.click(screen.getByRole("button", { name: "결과 확인하기" }));
    const pending = await screen.findByRole("button", { name: "추천을 준비하는 중..." });
    expect(pending).toBeDisabled();
    fireEvent.click(pending);
    expect(fetch).toHaveBeenCalledTimes(1);
    const request = vi.mocked(fetch).mock.calls[0]?.[1];
    expect(JSON.parse(String(request?.body)).answers).toHaveLength(8);
    resolveRequest(new Response(JSON.stringify({ profile: { dimensions: [], preferredFlavors: [], avoidedFlavors: [], preferredBaseSpirits: [] }, recommendations: [] }), { status: 200 }));
    expect(await screen.findByRole("heading", { name: "추천 결과를 받았어요" })).toBeVisible();
  });

  it("keeps answers after failure and retries with revised answers", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "failed" }), { status: 502 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ profile: { dimensions: [], preferredFlavors: [], avoidedFlavors: [], preferredBaseSpirits: [] }, recommendations: [] }), { status: 200 }));
    await renderAssessment();
    completeAssessment();
    fireEvent.click(screen.getByRole("checkbox", { name: "gin" }));
    fireEvent.click(screen.getByRole("button", { name: "결과 확인하기" }));
    expect(await screen.findByRole("button", { name: "다시 시도" })).toBeVisible();
    expect(screen.getByRole("checkbox", { name: "gin" })).toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "gin" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "rum" }));
    fireEvent.click(screen.getByRole("button", { name: "결과 확인하기" }));
    await screen.findByRole("heading", { name: "추천 결과를 받았어요" });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(String(vi.mocked(fetch).mock.calls[1]?.[1]?.body)).toContain('"answerIds":["rum"]');
  });

  it("retries explicitly with the same valid answers", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "failed" }), { status: 502 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ profile: { dimensions: [], preferredFlavors: [], avoidedFlavors: [], preferredBaseSpirits: [] }, recommendations: [] }), { status: 200 }));
    await renderAssessment();
    completeAssessment();
    fireEvent.click(screen.getByRole("button", { name: "결과 확인하기" }));
    fireEvent.click(await screen.findByRole("button", { name: "다시 시도" }));
    expect(await screen.findByRole("heading", { name: "추천 결과를 받았어요" })).toBeVisible();
    expect(vi.mocked(fetch).mock.calls[1]?.[1]?.body).toBe(vi.mocked(fetch).mock.calls[0]?.[1]?.body);
  });

  it("moves focus to the question title after navigation", async () => {
    await renderAssessment();
    fireEvent.click(screen.getByRole("radio", { name: "적당히 달콤한 게 좋아요" }));
    fireEvent.click(screen.getByRole("button", { name: "다음 질문" }));
    expect(screen.getByRole("heading", { name: "새콤한 맛은 어느 정도가 좋아요?" })).toHaveFocus();
  });
});
