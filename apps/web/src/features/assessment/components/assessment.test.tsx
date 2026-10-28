import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAssessmentStore } from "../model/assessment-store";
import { loadRecommendationResult, RECOMMENDATION_RESULT_STORAGE_KEY } from "../../recommendation/model/result-snapshot";
import { Assessment } from "./assessment";

const pushMock = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));

afterEach(cleanup);
beforeEach(() => {
  sessionStorage.clear();
  pushMock.mockClear();
  useAssessmentStore.setState({ currentIndex: 0, answers: {}, hasHydrated: false });
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          profile: { dimensions: [], preferredFlavors: [], avoidedFlavors: [], preferredBaseSpirits: [] },
          recommendations: [],
        }),
        { status: 200 },
      ),
    ),
  );
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
  render(
    <QueryClientProvider client={queryClient}>
      <Assessment />
    </QueryClientProvider>,
  );
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
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/result"));
    expect(loadRecommendationResult()).not.toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("keeps the Q8 answer after successful submission", async () => {
    await renderAssessment();
    completeAssessment();
    fireEvent.click(screen.getByRole("checkbox", { name: "gin" }));
    fireEvent.click(screen.getByRole("button", { name: "결과 확인하기" }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/result"));
    expect(useAssessmentStore.getState().answers["preferred-base-spirits"]).toEqual(["gin"]);
  });

  it("shows loading UI, prevents duplicate submission, and sends canonical answers", async () => {
    let resolveRequest!: (response: Response) => void;

    vi.mocked(fetch).mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveRequest = resolve;
        }),
    );

    await renderAssessment();
    completeAssessment();

    sessionStorage.setItem(RECOMMENDATION_RESULT_STORAGE_KEY, "old result");

    fireEvent.click(
      screen.getByRole("button", {
        name: "결과 확인하기",
      }),
    );

    // API 요청 중 로딩 UI가 표시된다.
    const loading = await screen.findByRole("status", {
      name: "칵테일 취향 분석 중",
    });

    expect(loading).toBeVisible();
    expect(loading).toHaveAttribute("aria-busy", "true");

    // 질문 및 제출 버튼이 화면에서 제거된다.
    expect(
      screen.queryByRole("button", {
        name: "결과 확인하기",
      }),
    ).not.toBeInTheDocument();

    // 요청이 추가로 발생하지 않는다.
    expect(fetch).toHaveBeenCalledTimes(1);

    // 이전 결과가 제거된다.
    expect(sessionStorage.getItem(RECOMMENDATION_RESULT_STORAGE_KEY)).toBeNull();

    // 8개 질문의 응답이 전송된다.
    const request = vi.mocked(fetch).mock.calls[0]?.[1];

    expect(JSON.parse(String(request?.body)).answers).toHaveLength(8);

    // API 응답 완료
    resolveRequest(
      new Response(
        JSON.stringify({
          profile: {
            dimensions: [],
            preferredFlavors: [],
            avoidedFlavors: [],
            preferredBaseSpirits: [],
          },
          recommendations: [],
        }),
        { status: 200 },
      ),
    );

    // 결과 페이지 이동
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/result");
    });
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
    expect(screen.queryByRole("status", { name: "칵테일 취향 분석 중" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "결과 확인하기" })).toBeVisible();
    expect(screen.getByRole("checkbox", { name: "gin" })).toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "gin" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "rum" }));
    fireEvent.click(screen.getByRole("button", { name: "결과 확인하기" }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/result"));
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
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/result"));
    expect(vi.mocked(fetch).mock.calls[1]?.[1]?.body).toBe(vi.mocked(fetch).mock.calls[0]?.[1]?.body);
  });

  it("moves focus to the question title after navigation", async () => {
    await renderAssessment();
    fireEvent.click(screen.getByRole("radio", { name: "적당히 달콤한 게 좋아요" }));
    fireEvent.click(screen.getByRole("button", { name: "다음 질문" }));
    expect(screen.getByRole("heading", { name: "새콤한 맛은 어느 정도가 좋아요?" })).toHaveFocus();
  });
});
