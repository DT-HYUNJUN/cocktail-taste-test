import { describe, expect, it, vi } from 'vitest';
import {
  ensureDatabaseConnection,
  type DatabaseConnection,
} from './database-connection';

function createConnection(
  overrides: Partial<DatabaseConnection> = {},
): DatabaseConnection {
  return {
    isInitialized: true,
    query: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    initialize: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('ensureDatabaseConnection', () => {
  it('uses a healthy initialized connection without reconnecting', async () => {
    const connection = createConnection();

    await ensureDatabaseConnection(connection);

    expect(connection.query).toHaveBeenCalledOnce();
    expect(connection.destroy).not.toHaveBeenCalled();
    expect(connection.initialize).not.toHaveBeenCalled();
  });

  it('initializes a disconnected data source before probing it', async () => {
    const connection = createConnection({ isInitialized: false });

    await ensureDatabaseConnection(connection);

    expect(connection.initialize).toHaveBeenCalledOnce();
    expect(connection.query).toHaveBeenCalledOnce();
  });

  it('performs one reconnect after a failed probe', async () => {
    const query = vi
      .fn<DatabaseConnection['query']>()
      .mockRejectedValueOnce(new Error('stale connection'))
      .mockResolvedValueOnce([{ '?column?': 1 }]);
    const connection = createConnection({ query });

    await ensureDatabaseConnection(connection);

    expect(connection.destroy).toHaveBeenCalledOnce();
    expect(connection.initialize).toHaveBeenCalledOnce();
    expect(connection.query).toHaveBeenCalledTimes(2);
  });

  it('fails after one reconnect attempt', async () => {
    const connection = createConnection({
      query: vi.fn().mockRejectedValue(new Error('database unavailable')),
    });

    await expect(ensureDatabaseConnection(connection)).rejects.toThrow(
      'after one reconnect attempt',
    );
    expect(connection.destroy).toHaveBeenCalledOnce();
    expect(connection.initialize).toHaveBeenCalledOnce();
    expect(connection.query).toHaveBeenCalledTimes(2);
  });
});
