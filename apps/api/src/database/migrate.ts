import { AppDataSource } from './data-source';

async function main(): Promise<void> {
  const command = process.argv[2];

  if (command !== 'run' && command !== 'revert' && command !== 'show') {
    throw new Error('Usage: migrate.ts <run|revert|show>');
  }

  await AppDataSource.initialize();

  try {
    if (command === 'run') {
      await AppDataSource.runMigrations({ transaction: 'all' });
    } else if (command === 'revert') {
      await AppDataSource.undoLastMigration({ transaction: 'all' });
    } else {
      const pending = await AppDataSource.showMigrations();
      console.log(`Pending migrations: ${pending}`);
    }
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
