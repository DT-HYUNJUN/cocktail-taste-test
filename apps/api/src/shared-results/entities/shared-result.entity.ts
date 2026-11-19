import type { RecommendationResponse } from '@cocktail-taste-test/contracts';
import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'shared_results' })
export class SharedResultEntity {
  @PrimaryColumn({ type: 'varchar', length: 22 })
  id!: string;

  @Column({ name: 'schema_version', type: 'smallint', default: 1 })
  schemaVersion!: number;

  @Column({ type: 'jsonb' })
  result!: RecommendationResponse;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;
}
