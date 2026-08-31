import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTaskCardsAndPoints1787900890178 implements MigrationInterface {
  name = 'CreateTaskCardsAndPoints1787900890178';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`task_cards\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`owner_id\` BIGINT NOT NULL,
        \`name\` VARCHAR(100) NOT NULL,
        \`sort_order\` INT NOT NULL DEFAULT 0,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`idx_task_cards_owner_id\` (\`owner_id\`),
        CONSTRAINT \`FK_task_cards_owner_id\` FOREIGN KEY (\`owner_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      ALTER TABLE \`tasks\`
      ADD COLUMN \`card_id\` BIGINT NULL AFTER \`list_id\`,
      ADD COLUMN \`points\` DECIMAL(5,2) NULL AFTER \`estimate_minutes\`;
    `);

    await queryRunner.query(`
      ALTER TABLE \`tasks\`
      ADD INDEX \`idx_tasks_card_id\` (\`card_id\`),
      ADD CONSTRAINT \`FK_tasks_card_id\` FOREIGN KEY (\`card_id\`) REFERENCES \`task_cards\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`tasks\` DROP FOREIGN KEY \`FK_tasks_card_id\`;`);
    await queryRunner.query(`ALTER TABLE \`tasks\` DROP INDEX \`idx_tasks_card_id\`;`);
    await queryRunner.query(`ALTER TABLE \`tasks\` DROP COLUMN \`card_id\`, DROP COLUMN \`points\`;`);
    await queryRunner.query(`DROP TABLE \`task_cards\`;`);
  }
}
