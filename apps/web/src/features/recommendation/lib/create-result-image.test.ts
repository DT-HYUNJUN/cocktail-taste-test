import type { RecommendationResponse } from "@cocktail-taste-test/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createResultImage } from "./create-result-image";

const result: RecommendationResponse = {
  profile: {
    dimensions: [
      { dimension: "sweet", score: 3 },
      { dimension: "sour", score: 4 },
      { dimension: "bitter", score: 1 },
      { dimension: "alcoholIntensity", score: 2 },
      { dimension: "refreshing", score: 5 },
    ],
    preferredFlavors: ["citrus"],
    avoidedFlavors: [],
    preferredBaseSpirits: ["rum"],
  },
  recommendations: [{
    rank: 1,
    cocktail: {
      id: "mojito",
      name: "Mojito",
      imageUrl: null,
      dimensions: { sweet: 3, sour: 4, bitter: 1, alcoholIntensity: 2, refreshing: 5 },
      flavors: ["citrus"],
      baseSpirits: ["rum"],
    },
    reasons: [
      { type: "core-match", dimensions: ["sour", "refreshing"] },
      { type: "flavor-match", flavors: ["citrus"] },
      { type: "base-spirit-match", baseSpirits: ["rum"] },
    ],
  }],
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("createResultImage", () => {
  it("creates a 1600x1200 PNG and contains the cocktail image without cropping", async () => {
    const drawImage = vi.fn();
    const context = {
      beginPath: vi.fn(), closePath: vi.fn(), roundRect: vi.fn(), fill: vi.fn(), stroke: vi.fn(), clip: vi.fn(), save: vi.fn(), restore: vi.fn(),
      fillRect: vi.fn(), arc: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), fillText: vi.fn(), drawImage,
      measureText: vi.fn((text: string) => ({ width: text.length * 12 })),
      fillStyle: "", strokeStyle: "", lineWidth: 1, font: "", textAlign: "start",
    } as unknown as CanvasRenderingContext2D;
    const blob = new Blob(["png"], { type: "image/png" });
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => context),
      toBlob: vi.fn((callback: BlobCallback) => callback(blob)),
    } as unknown as HTMLCanvasElement;

    vi.spyOn(document, "createElement").mockReturnValue(canvas);

    class TestImage {
      width = 1200;
      height = 800;
      crossOrigin = "";
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(value: string) {
        if (value === "/icon.svg") {
          this.width = 100;
          this.height = 100;
        }
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal("Image", TestImage);

    const image = await createResultImage(result);

    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(1200);
    expect(image.blob).toBe(blob);
    expect(image.fileName).toBe("cocktail-taste-mojito.png");
    expect(drawImage).toHaveBeenCalledWith(expect.any(TestImage), 1080, expect.closeTo(256.67, 1), 400, expect.closeTo(266.67, 1));
  });

  it("requires a cocktail recommendation", async () => {
    await expect(createResultImage({ ...result, recommendations: [] })).rejects.toThrow("Recommendation is required");
  });
});
