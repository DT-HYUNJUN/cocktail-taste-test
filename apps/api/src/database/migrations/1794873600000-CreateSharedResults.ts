import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSharedResults1794873600000 implements MigrationInterface {
  name = 'CreateSharedResults1794873600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE shared_results (
        id VARCHAR(22) PRIMARY KEY,
        schema_version SMALLINT NOT NULL DEFAULT 1,
        result JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        expires_at TIMESTAMPTZ NOT NULL,

        CONSTRAINT shared_results_id_format
          CHECK (id ~ '^[A-Za-z0-9_-]{22}$'),

        CONSTRAINT shared_results_schema_version
          CHECK (schema_version = 1),

        CONSTRAINT shared_results_expiration
          CHECK (expires_at > created_at)
      )
    `);
    await queryRunner.query(
      'CREATE INDEX shared_results_expires_at_idx ON shared_results (expires_at)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE shared_results');
  }
}
