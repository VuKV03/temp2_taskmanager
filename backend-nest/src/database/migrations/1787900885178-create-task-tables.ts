import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTaskTables1787900885178 implements MigrationInterface {
  name = 'CreateTaskTables1787900885178';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`tasks\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`list_id\` BIGINT NULL,
        \`parent_task_id\` BIGINT NULL,
        \`creator_id\` BIGINT NOT NULL,
        \`assignee_id\` BIGINT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        \`description\` TEXT NULL,
        \`status\` VARCHAR(20) NOT NULL DEFAULT 'todo',
        \`priority\` VARCHAR(10) NOT NULL DEFAULT 'medium',
        \`start_date\` DATETIME NULL,
        \`due_date\` DATETIME NULL,
        \`completed_at\` DATETIME NULL,
        \`estimate_minutes\` INT NULL,
        \`recurrence_rule\` VARCHAR(100) NULL,
        \`sort_order\` INT NOT NULL DEFAULT 0,
        \`is_archived\` TINYINT NOT NULL DEFAULT 0,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`idx_tasks_list_id\` (\`list_id\`),
        INDEX \`idx_tasks_parent_task_id\` (\`parent_task_id\`),
        INDEX \`idx_tasks_status\` (\`status\`),
        INDEX \`idx_tasks_due_date\` (\`due_date\`),
        INDEX \`idx_tasks_completed_at\` (\`completed_at\`),
        INDEX \`idx_tasks_assignee_due\` (\`assignee_id\`, \`due_date\`, \`status\`),
        INDEX \`idx_tasks_assignee_completed\` (\`assignee_id\`, \`completed_at\`),
        CONSTRAINT \`FK_tasks_list_id\` FOREIGN KEY (\`list_id\`) REFERENCES \`task_lists\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT \`FK_tasks_parent_task_id\` FOREIGN KEY (\`parent_task_id\`) REFERENCES \`tasks\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT \`FK_tasks_creator_id\` FOREIGN KEY (\`creator_id\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`FK_tasks_assignee_id\` FOREIGN KEY (\`assignee_id\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`tags\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`user_id\` BIGINT NULL,
        \`name\` VARCHAR(50) NOT NULL,
        \`color\` VARCHAR(7) NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`UQ_tags_user_name\` (\`user_id\`, \`name\`),
        CONSTRAINT \`FK_tags_user_id\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`task_tags\` (
        \`task_id\` BIGINT NOT NULL,
        \`tag_id\` BIGINT NOT NULL,
        PRIMARY KEY (\`task_id\`, \`tag_id\`),
        INDEX \`idx_task_tags_tag_id\` (\`tag_id\`),
        CONSTRAINT \`FK_task_tags_task_id\` FOREIGN KEY (\`task_id\`) REFERENCES \`tasks\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`FK_task_tags_tag_id\` FOREIGN KEY (\`tag_id\`) REFERENCES \`tags\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`task_tags\`;`);
    await queryRunner.query(`DROP TABLE \`tags\`;`);
    await queryRunner.query(`DROP TABLE \`tasks\`;`);
  }
}
