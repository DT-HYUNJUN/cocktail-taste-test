import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCocktails1792022400000 implements MigrationInterface {
  name = 'CreateCocktails1792022400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE FUNCTION cocktail_valid_set(
        values_to_check TEXT[],
        allowed_values TEXT[]
      )
      RETURNS BOOLEAN
      LANGUAGE SQL
      IMMUTABLE
      AS $$
        SELECT
          values_to_check IS NOT NULL
          AND array_position(values_to_check, NULL) IS NULL
          AND NOT EXISTS (
            SELECT 1
            FROM unnest(values_to_check) AS value
            WHERE NOT (value = ANY(allowed_values))
          )
          AND cardinality(values_to_check) = (
            SELECT COUNT(DISTINCT value)
            FROM unnest(values_to_check) AS value
          )
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE cocktails (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        image_url TEXT,

        sweet SMALLINT NOT NULL,
        sour SMALLINT NOT NULL,
        bitter SMALLINT NOT NULL,
        alcohol_intensity SMALLINT NOT NULL,
        refreshing SMALLINT NOT NULL,

        flavors TEXT[] NOT NULL DEFAULT '{}'::text[],
        base_spirits TEXT[] NOT NULL DEFAULT '{}'::text[],

        is_active BOOLEAN NOT NULL DEFAULT false,

        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT cocktails_id_not_blank
          CHECK (length(btrim(id)) > 0),

        CONSTRAINT cocktails_name_not_blank
          CHECK (length(btrim(name)) > 0),

        CONSTRAINT cocktails_sweet_range
          CHECK (sweet BETWEEN 1 AND 5),

        CONSTRAINT cocktails_sour_range
          CHECK (sour BETWEEN 1 AND 5),

        CONSTRAINT cocktails_bitter_range
          CHECK (bitter BETWEEN 1 AND 5),

        CONSTRAINT cocktails_alcohol_intensity_range
          CHECK (alcohol_intensity BETWEEN 1 AND 5),

        CONSTRAINT cocktails_refreshing_range
          CHECK (refreshing BETWEEN 1 AND 5),

        CONSTRAINT cocktails_flavors_valid
          CHECK (
            cocktail_valid_set(
              flavors,
              ARRAY[
                'citrus', 'fruity', 'tropical',
                'herbal', 'floral', 'creamy',
                'coffee', 'spicy', 'smoky'
              ]::text[]
            )
          ),

        CONSTRAINT cocktails_base_spirits_valid
          CHECK (
            cocktail_valid_set(
              base_spirits,
              ARRAY[
                'gin', 'vodka', 'rum',
                'tequila', 'whiskey', 'mezcal'
              ]::text[]
            )
          )
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE cocktails');
    await queryRunner.query('DROP FUNCTION cocktail_valid_set(TEXT[], TEXT[])');
  }
}
