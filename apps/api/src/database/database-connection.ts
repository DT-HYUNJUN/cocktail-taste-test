export interface DatabaseConnection {
  readonly isInitialized: boolean;
  query(query: string): Promise<unknown>;
  initialize(): Promise<unknown>;
  destroy(): Promise<void>;
}

export async function ensureDatabaseConnection(
  dataSource: DatabaseConnection,
): Promise<void> {
  try {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    await dataSource.query('SELECT 1');
    return;
  } catch (initialError) {
    try {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }

      await dataSource.initialize();
      await dataSource.query('SELECT 1');
    } catch (reconnectError) {
      throw new AggregateError(
        [initialError, reconnectError],
        'Database connection validation failed after one reconnect attempt',
      );
    }
  }
}
