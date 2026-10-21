import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useAssessmentStore } from "../model/assessment-store";
import { Assessment } from "./assessment";

afterEach(cleanup);
beforeEach(() => {
  sessionStorage.clear();
  useAssessmentStore.setState({ currentIndex: 0, answers: {}, hasHydrated: false });
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
  render(<Assessment />);
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
    expect(screen.getByRole("heading", { name: "답변이 모두 저장되었어요." })).toBeVisible();
  });

  it("returns from completion to Q8 with the existing answer", async () => {
    await renderAssessment();
    completeAssessment();
    fireEvent.click(screen.getByRole("checkbox", { name: "gin" }));
    fireEvent.click(screen.getByRole("button", { name: "결과 확인하기" }));
    fireEvent.click(screen.getByRole("button", { name: "답변 수정하기" }));

    expect(screen.getByLabelText("질문 8 / 8")).toBeVisible();
    expect(screen.getByRole("checkbox", { name: "gin" })).toBeChecked();
  });

  it("moves focus to the question title after navigation", async () => {
    await renderAssessment();
    fireEvent.click(screen.getByRole("radio", { name: "적당히 달콤한 게 좋아요" }));
    fireEvent.click(screen.getByRole("button", { name: "다음 질문" }));
    expect(screen.getByRole("heading", { name: "새콤한 맛은 어느 정도가 좋아요?" })).toHaveFocus();
  });
});
