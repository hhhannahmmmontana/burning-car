import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRatingTrigger1775732107269 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_joke_rating()
            RETURNS TRIGGER AS $$
            BEGIN
                IF TG_OP = 'DELETE' THEN
                    UPDATE joke SET
                        rating = COALESCE((
                            SELECT AVG(score) FROM rating WHERE joke_id = OLD.joke_id
                        ), 0),
                        rates_amount = (
                            SELECT COUNT(*) FROM rating WHERE joke_id = OLD.joke_id
                        )
                    WHERE id = OLD.joke_id;
                    RETURN OLD;
                ELSE
                    UPDATE joke SET
                        rating = COALESCE((
                            SELECT AVG(score) FROM rating WHERE joke_id = NEW.joke_id
                        ), 0),
                        rates_amount = (
                            SELECT COUNT(*) FROM rating WHERE joke_id = NEW.joke_id
                        )
                    WHERE id = NEW.joke_id;
                    RETURN NEW;
                END IF;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
            CREATE TRIGGER rating_changed
            AFTER INSERT OR UPDATE OR DELETE ON rating
            FOR EACH ROW EXECUTE FUNCTION update_joke_rating();
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER IF EXISTS rating_changed ON rating`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS update_joke_rating`);
    }
}