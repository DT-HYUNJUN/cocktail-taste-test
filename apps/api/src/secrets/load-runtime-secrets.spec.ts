import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
}));

vi.mock('@aws-sdk/client-ssm', () => ({
  SSMClient: class {
    send = sendMock;
  },
  GetParametersCommand: class {
    constructor(public input: unknown) {}
  },
}));

const HMAC_PARAMETER = '/cocktail-taste/prod/api-hmac-secret';
const DATABASE_PARAMETER = '/cocktail-taste/prod/database-password';
const HMAC_SECRET = 'test-hmac-secret-at-least-32-characters';

async function loadSubject() {
  // 모듈 내부의 loadPromise를 테스트마다 초기화
  vi.resetModules();

  return import('./load-runtime-secrets.js');
}

function mockSuccessfulResponse() {
  sendMock.mockResolvedValue({
    Parameters: [
      {
        Name: HMAC_PARAMETER,
        Value: HMAC_SECRET,
      },
      {
        Name: DATABASE_PARAMETER,
        Value: 'test-database-password',
      },
    ],
    InvalidParameters: [],
  });
}

describe('loadRuntimeSecrets', () => {
  beforeEach(() => {
    vi.stubEnv('API_HMAC_SECRET_PARAMETER_NAME', HMAC_PARAMETER);
    vi.stubEnv('DATABASE_PASSWORD_PARAMETER_NAME', DATABASE_PARAMETER);
    vi.stubEnv('API_HMAC_SECRET', '');
    vi.stubEnv('DATABASE_PASSWORD', '');

    sendMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('SSM에서 두 비밀정보를 읽어 환경 변수에 적용한다', async () => {
    mockSuccessfulResponse();

    const { loadRuntimeSecrets } = await loadSubject();

    await loadRuntimeSecrets();

    expect(process.env.API_HMAC_SECRET).toBe(HMAC_SECRET);
    expect(process.env.DATABASE_PASSWORD).toBe('test-database-password');
    expect(sendMock).toHaveBeenCalledTimes(1);

    const command = sendMock.mock.calls[0]?.[0];

    expect(command.input).toEqual({
      Names: [HMAC_PARAMETER, DATABASE_PARAMETER],
      WithDecryption: true,
    });
  });

  it('SSM 파라미터가 누락되면 실패한다', async () => {
    sendMock.mockResolvedValue({
      Parameters: [
        {
          Name: HMAC_PARAMETER,
          Value: HMAC_SECRET,
        },
      ],
      InvalidParameters: [DATABASE_PARAMETER],
    });

    const { loadRuntimeSecrets } = await loadSubject();

    await expect(loadRuntimeSecrets()).rejects.toThrow(
      'One or more SSM parameters are unavailable',
    );

    expect(process.env.API_HMAC_SECRET).toBe('');
    expect(process.env.DATABASE_PASSWORD).toBe('');
  });

  it('SSM 조회 오류가 발생하면 실패하고 재시도할 수 있다', async () => {
    sendMock.mockRejectedValueOnce(new Error('SSM unavailable'));
    mockSuccessfulResponse();

    const { loadRuntimeSecrets } = await loadSubject();

    await expect(loadRuntimeSecrets()).rejects.toThrow('SSM unavailable');

    await loadRuntimeSecrets();

    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(process.env.API_HMAC_SECRET).toBe(HMAC_SECRET);
  });

  it('동시에 여러 번 호출해도 SSM 조회는 한 번만 실행한다', async () => {
    mockSuccessfulResponse();

    const { loadRuntimeSecrets } = await loadSubject();

    await Promise.all([
      loadRuntimeSecrets(),
      loadRuntimeSecrets(),
      loadRuntimeSecrets(),
    ]);

    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it('SSM 파라미터 이름 중 하나만 설정되면 실패한다', async () => {
    vi.stubEnv('DATABASE_PASSWORD_PARAMETER_NAME', '');

    const { loadRuntimeSecrets } = await loadSubject();

    await expect(loadRuntimeSecrets()).rejects.toThrow(
      'Incomplete SSM secret configuration',
    );

    expect(sendMock).not.toHaveBeenCalled();
  });

  it('Lambda 환경에서 SSM 설정이 없으면 실패한다', async () => {
    vi.stubEnv('AWS_LAMBDA_FUNCTION_NAME', 'cocktail-taste-api');
    vi.stubEnv('API_HMAC_SECRET_PARAMETER_NAME', '');
    vi.stubEnv('DATABASE_PASSWORD_PARAMETER_NAME', '');

    const { loadRuntimeSecrets } = await loadSubject();

    await expect(loadRuntimeSecrets()).rejects.toThrow(
      'SSM secret configuration is required in Lambda',
    );

    expect(sendMock).not.toHaveBeenCalled();
  });
});
