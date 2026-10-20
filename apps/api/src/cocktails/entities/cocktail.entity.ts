import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'cocktails' })
export class CocktailEntity {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl!: string | null;

  @Column({ type: 'smallint' })
  sweet!: number;

  @Column({ type: 'smallint' })
  sour!: number;

  @Column({ type: 'smallint' })
  bitter!: number;

  @Column({ name: 'alcohol_intensity', type: 'smallint' })
  alcoholIntensity!: number;

  @Column({ type: 'smallint' })
  refreshing!: number;

  @Column({
    type: 'text',
    array: true,
    default: () => "'{}'::text[]",
  })
  flavors!: string[];

  @Column({
    name: 'base_spirits',
    type: 'text',
    array: true,
    default: () => "'{}'::text[]",
  })
  baseSpirits!: string[];

  @Column({ name: 'is_active', type: 'boolean', default: false })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
