import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSearchIndexes1775732072290 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE INDEX idx_joke_text_fts_ru 
             ON joke USING gin(to_tsvector('russian', text))`
        );

        await queryRunner.query(
            `CREATE INDEX idx_joke_rates_id 
             ON joke (rates_amount DESC, id ASC)`
        );

        await queryRunner.query(
            `CREATE INDEX idx_tag_name 
             ON tag (name)`
        );

        await queryRunner.query(
            `CREATE INDEX idx_joke_tags_tag_joke_id 
             ON joke_tags_tag ("joke_id")`
        );

        await queryRunner.query(
            `CREATE INDEX idx_joke_tags_tag_tag_name 
             ON joke_tags_tag ("tag_name")`
        );

        await queryRunner.query(
            `CREATE INDEX idx_joke_tags_tag_composite 
             ON joke_tags_tag ("tag_name", "joke_id")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_joke_text_fts_ru`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_joke_rates_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_tag_name`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_joke_tags_tag_joke_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_joke_tags_tag_tag_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_joke_tags_tag_composite`);
    }
}