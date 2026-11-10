import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearApiHmacSecretCache,
  loadApiHmacSecret,
} from "./api-hmac-secret";

const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
}));

vi.mock("@aws-sdk/client-ssm", () => ({
  GetParameterCommand: class GetParameterCommand {
    constructor(readonly input: unknown) {}
  },
  SSMClient: class SSMClient {
    send = sendMock;
  },
}));

beforeEach(() => {
  clearApiHmacSecretCache();
  sendMock.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("loadApiHmacSecret", () => {
  it("uses the local secret outside production", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("API_HMAC_SECRET", "local-secret-with-at-least-32-characters");

    await expect(loadApiHmacSecret()).resolves.toBe(
      "local-secret-with-at-least-32-characters",
    );
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("loads and caches the production secret from SSM", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("API_AWS_REGION", "ap-southeast-1");
    vi.stubEnv(
      "API_HMAC_SECRET_PARAMETER_NAME",
      "/cocktail-taste/prod/api-hmac-secret",
    );
    sendMock.mockResolvedValue({
      Parameter: { Value: "production-secret-with-at-least-32-characters" },
    });

    await expect(loadApiHmacSecret()).resolves.toBe(
      "production-secret-with-at-least-32-characters",
    );
    await expect(loadApiHmacSecret()).resolves.toBe(
      "production-secret-with-at-least-32-characters",
    );

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0]?.[0]).toMatchObject({
      input: {
        Name: "/cocktail-taste/prod/api-hmac-secret",
        WithDecryption: true,
      },
    });
  });

  it("fails closed when the production SSM configuration is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("API_AWS_REGION", "");
    vi.stubEnv("API_HMAC_SECRET_PARAMETER_NAME", "");

    await expect(loadApiHmacSecret()).rejects.toThrow(
      "Missing API HMAC SSM configuration",
    );
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("clears a failed lookup so a later request can retry", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("API_AWS_REGION", "ap-southeast-1");
    vi.stubEnv(
      "API_HMAC_SECRET_PARAMETER_NAME",
      "/cocktail-taste/prod/api-hmac-secret",
    );
    sendMock
      .mockRejectedValueOnce(new Error("SSM unavailable"))
      .mockResolvedValueOnce({
        Parameter: { Value: "recovered-secret-with-at-least-32-characters" },
      });

    await expect(loadApiHmacSecret()).rejects.toThrow("SSM unavailable");
    await expect(loadApiHmacSecret()).resolves.toBe(
      "recovered-secret-with-at-least-32-characters",
    );
    expect(sendMock).toHaveBeenCalledTimes(2);
  });
});
