import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTaskActivitiesTable1787900883500 implements MigrationInterface {
  name = 'CreateTaskActivitiesTable1787900883500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`task_activities\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`task_id\` BIGINT NULL,
        \`user_id\` BIGINT NOT NULL,
        \`action\` VARCHAR(30) NOT NULL,
        \`field_name\` VARCHAR(50) NULL,
        \`old_value\` VARCHAR(255) NULL,
        \`new_value\` VARCHAR(255) NULL,
        \`task_title\` VARCHAR(255) NOT NULL,
        \`metadata\` JSON NULL,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`idx_task_activities_task_id\` (\`task_id\`),
        INDEX \`idx_task_activities_user_created\` (\`user_id\`, \`created_at\`),
        CONSTRAINT \`FK_task_activities_user_id\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB;
    `);
    // No FK on task_id on purpose — history must survive hard deletes and
    // this table is written from the `task` feature without importing it.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`task_activities\`;`);
  }
}
