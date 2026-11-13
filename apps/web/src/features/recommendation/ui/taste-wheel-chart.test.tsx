import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TasteWheelChart } from "./taste-wheel-chart";

afterEach(cleanup);

describe("TasteWheelChart", () => {
  it("presents each taste score in an accessible radial chart", () => {
    render(
      <TasteWheelChart
        dimensions={[
          { dimension: "sweet", score: 5 },
          { dimension: "sour", score: 4 },
          { dimension: "bitter", score: 1 },
          { dimension: "alcoholIntensity", score: 3 },
          { dimension: "refreshing", score: 5 },
        ]}
      />,
    );

    expect(screen.getByRole("img", { name: /나의 칵테일 취향 원형 차트.*단맛 5점.*청량감 5점/ })).not.toBeNull();
    expect(screen.getByText("단맛").closest("textPath")).not.toBeNull();
    expect(screen.getByText("도수감").closest("textPath")).not.toBeNull();
    expect(screen.getByText("바가 길수록 해당 취향 점수가 높아요.")).not.toBeNull();
  });

  it("renders nothing when there are no taste dimensions", () => {
    const { container } = render(<TasteWheelChart dimensions={[]} />);

    expect(container.firstChild).toBeNull();
  });
});
