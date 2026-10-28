import { expect, test, type Page, type Route } from "@playwright/test";

const successResponse = {
  profile: {
    dimensions: [
      { dimension: "sweet", score: 3 }, { dimension: "sour", score: 3 },
      { dimension: "bitter", score: 3 }, { dimension: "alcoholIntensity", score: 3 },
      { dimension: "refreshing", score: 3 },
    ],
    preferredFlavors: ["citrus"], avoidedFlavors: ["smoky"], preferredBaseSpirits: ["gin"],
  },
  recommendations: [{
    rank: 1,
    cocktail: {
      id: "tom-collins", name: "Tom Collins", imageUrl: null,
      dimensions: { sweet: 3, sour: 4, bitter: 1, alcoholIntensity: 2, refreshing: 5 },
      flavors: ["citrus"], baseSpirits: ["gin"],
    },
    reasons: [
      { type: "core-match", dimensions: ["sweet", "sour"] },
      { type: "flavor-match", flavors: ["citrus"] },
      { type: "base-spirit-match", baseSpirits: ["gin"] },
    ],
  }],
};

async function mockRecommendation(page: Page, handler: (route: Route) => Promise<void> | void = (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(successResponse) })) {
  await page.route("**/api/recommendations", handler);
}

async function startAssessment(page: Page) {
  await page.goto("/");
  await page.locator('a[href="/test"]').click();
  await expect(page).toHaveURL(/\/test$/);
}

async function answerSingle(page: Page, value = "medium") {
  await page.locator(`input[type="radio"][value="${value}"]`).check();
  await page.getByRole("button", { name: "다음 질문" }).click();
}

async function completeAssessment(page: Page) {
  for (let index = 0; index < 5; index += 1) await answerSingle(page);
  await page.locator('input[type="checkbox"][value="citrus"]').check();
  await page.getByRole("button", { name: "다음 질문" }).click();
  await page.locator('input[type="checkbox"][value="smoky"]').check();
  await page.getByRole("button", { name: "다음 질문" }).click();
  await page.locator('input[type="checkbox"][value="gin"]').check();
  await page.getByRole("button", { name: "결과 확인하기" }).click();
}

test("E2E-01 completes the full assessment and renders a recommendation", async ({ page }) => {
  await mockRecommendation(page);
  await startAssessment(page);
  await completeAssessment(page);
  await expect(page).toHaveURL(/\/result$/);
  await expect(page.getByRole("heading", { name: "당신을 위한 한 잔을 찾았어요!" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tom Collins" })).toBeVisible();
  await expect(page.getByText("선호하는 진 베이스 칵테일이에요")).toBeVisible();
});

test("E2E-02 preserves and revises a previous answer before submission", async ({ page }) => {
  let requestBody: unknown;
  await mockRecommendation(page, async (route) => {
    requestBody = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(successResponse) });
  });
  await startAssessment(page);
  await page.locator('input[type="radio"][value="low"]').check();
  await page.getByRole("button", { name: "다음 질문" }).click();
  await page.getByRole("button", { name: "이전 질문" }).click();
  await expect(page.locator('input[type="radio"][value="low"]')).toBeChecked();
  await page.locator('input[type="radio"][value="high"]').check();
  await page.getByRole("button", { name: "다음 질문" }).click();
  for (let index = 1; index < 5; index += 1) await answerSingle(page);
  await page.getByRole("button", { name: "다음 질문" }).click();
  await page.getByRole("button", { name: "다음 질문" }).click();
  await page.getByRole("button", { name: "결과 확인하기" }).click();
  await expect(page).toHaveURL(/\/result$/);
  expect(requestBody).toEqual(expect.objectContaining({ answers: expect.arrayContaining([{ questionId: "sweet", answerId: "high" }]) }));
});

test("E2E-03 restores partial assessment progress after reload", async ({ page }) => {
  await startAssessment(page);
  await answerSingle(page, "high");
  await page.locator('input[type="radio"][value="low"]').check();
  await page.reload();
  await expect(page.getByLabel("질문 2 / 8")).toBeVisible();
  await expect(page.locator('input[type="radio"][value="low"]')).toBeChecked();
  await page.getByRole("button", { name: "이전 질문" }).click();
  await expect(page.locator('input[type="radio"][value="high"]')).toBeChecked();
});

test("E2E-04 restores the result and card after reload", async ({ page }) => {
  await mockRecommendation(page);
  await startAssessment(page);
  await completeAssessment(page);
  await expect(page).toHaveURL(/\/result$/);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Tom Collins" })).toBeVisible();
});

test("E2E-05 treats an empty recommendation response as a normal result", async ({ page }) => {
  await mockRecommendation(page, (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ...successResponse, recommendations: [] }) }));
  await startAssessment(page);
  await completeAssessment(page);
  await expect(page.getByRole("heading", { name: "취향 분석을 완료했어요!" })).toBeVisible();
  await expect(page.getByText("아직 추천할 수 있는 칵테일이 없어요")).toBeVisible();
});

test("E2E-06 keeps answers and succeeds after an explicit retry", async ({ page }) => {
  let attempts = 0;
  await mockRecommendation(page, async (route) => {
    attempts += 1;
    await route.fulfill(attempts === 1
      ? { status: 502, contentType: "application/json", body: JSON.stringify({ message: "temporary failure" }) }
      : { status: 200, contentType: "application/json", body: JSON.stringify(successResponse) });
  });
  await startAssessment(page);
  await completeAssessment(page);
  await expect(page.getByRole("button", { name: "다시 시도" })).toBeVisible();
  await expect(page.locator('input[type="checkbox"][value="gin"]')).toBeChecked();
  await page.getByRole("button", { name: "다시 시도" }).click();
  await expect(page).toHaveURL(/\/result$/);
  expect(attempts).toBe(2);
});

test("E2E-07 restarting clears assessment and result snapshots", async ({ page }) => {
  await mockRecommendation(page);
  await startAssessment(page);
  await completeAssessment(page);
  await page.getByRole("button", { name: "취향 테스트 다시 하기" }).click();
  await expect(page).toHaveURL(/\/test$/);
  await expect(page.getByLabel("질문 1 / 8")).toBeVisible();
  await expect(page.locator('input[type="radio"]:checked')).toHaveCount(0);
  expect(await page.evaluate(() => sessionStorage.getItem("cocktail-taste-test:recommendation-result"))).toBeNull();
});

test("E2E-08 guides direct result access without a snapshot", async ({ page }) => {
  await page.goto("/result");
  await expect(page.getByRole("heading", { name: "저장된 추천 결과가 없어요" })).toBeVisible();
  await page.getByRole("link", { name: "취향 테스트로 이동" }).click();
  await expect(page).toHaveURL(/\/test$/);
});

test("mobile keyboard flow keeps controls accessible without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startAssessment(page);
  const option = page.locator('input[type="radio"][value="medium"]');
  await option.focus();
  await page.keyboard.press("Space");
  await page.getByRole("button", { name: "다음 질문" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("질문 2 / 8")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
