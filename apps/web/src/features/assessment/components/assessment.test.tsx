import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Assessment } from "./assessment";

afterEach(cleanup);

const advanceToPreferredFlavors = () => {
  for (let question = 0; question < 5; question += 1) {
    fireEvent.click(screen.getByRole("radio", { name: "잘 모르겠어요" }));
    fireEvent.click(screen.getByRole("button", { name: "다음 질문" }));
  }
};

describe("Assessment", () => {
  it("moves from Q1 to Q2 only after medium is selected and next is clicked", () => {
    render(<Assessment />);
    const next = screen.getByRole("button", { name: "다음 질문" });
    expect(next).toBeDisabled();
    fireEvent.click(screen.getByRole("radio", { name: "적당히 달콤한 게 좋아요" }));
    expect(screen.getByRole("heading", { name: "칵테일의 단맛은 어느 정도가 좋아요?" })).toBeVisible();
    fireEvent.click(next);
    expect(screen.getByRole("heading", { name: "새콤한 맛은 어느 정도가 좋아요?" })).toBeVisible();
    expect(screen.getByLabelText("질문 2 / 8")).toBeVisible();
  });

  it("keeps an existing selection when returning to a previous question", () => {
    render(<Assessment />);
    fireEvent.click(screen.getByRole("radio", { name: "적당히 달콤한 게 좋아요" }));
    fireEvent.click(screen.getByRole("button", { name: "다음 질문" }));
    fireEvent.click(screen.getByRole("button", { name: "이전 질문" }));
    expect(screen.getByRole("radio", { name: "적당히 달콤한 게 좋아요" })).toBeChecked();
  });

  it("enforces multi-select limits and prevents preferred and avoided flavor overlap", () => {
    render(<Assessment />);
    advanceToPreferredFlavors();

    fireEvent.click(screen.getByRole("checkbox", { name: "레몬·라임처럼 상큼한 시트러스" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "민트·허브처럼 싱그러운 향" }));
    expect(screen.getByRole("checkbox", { name: "훈연향이 느껴지는 스모키한 풍미" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "다음 질문" }));

    expect(screen.getByRole("checkbox", { name: "레몬·라임처럼 상큼한 시트러스" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "훈연향이 느껴지는 스모키한 풍미" })).not.toBeDisabled();
  });
});
