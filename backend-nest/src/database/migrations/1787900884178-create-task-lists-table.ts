import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTaskListsTable1787900884178 implements MigrationInterface {
  name = 'CreateTaskListsTable1787900884178';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`task_lists\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`owner_id\` BIGINT NOT NULL,
        \`name\` VARCHAR(100) NOT NULL,
        \`description\` VARCHAR(255) NULL,
        \`color\` VARCHAR(7) NULL,
        \`sort_order\` INT NOT NULL DEFAULT 0,
        \`is_archived\` TINYINT NOT NULL DEFAULT 0,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`idx_task_lists_owner_id\` (\`owner_id\`),
        UNIQUE INDEX \`UQ_task_lists_owner_name\` (\`owner_id\`, \`name\`),
        CONSTRAINT \`FK_task_lists_owner_id\` FOREIGN KEY (\`owner_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`task_lists\`;`);
  }
}
