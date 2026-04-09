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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX idx_joke_text_fts_ru`);
        await queryRunner.query(`DROP INDEX idx_joke_rates_id`);
    }
}