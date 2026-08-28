import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationsTable1787900887178 implements MigrationInterface {
  name = 'CreateNotificationsTable1787900887178';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`notifications\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`user_id\` BIGINT NOT NULL,
        \`task_id\` BIGINT NULL,
        \`type\` VARCHAR(30) NOT NULL,
        \`message\` VARCHAR(255) NOT NULL,
        \`is_read\` BOOLEAN NOT NULL DEFAULT FALSE,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`idx_notifications_user_read_created\` (\`user_id\`, \`is_read\`, \`created_at\`),
        CONSTRAINT \`FK_notifications_user_id\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB;
    `);
    // No FK on task_id, same reasoning as `task_activities` — a
    // notification about a task must survive that task being hard-deleted.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`notifications\`;`);
  }
}
