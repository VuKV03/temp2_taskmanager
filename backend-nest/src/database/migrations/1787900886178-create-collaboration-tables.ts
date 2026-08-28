import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCollaborationTables1787900886178 implements MigrationInterface {
  name = 'CreateCollaborationTables1787900886178';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`task_comments\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`task_id\` BIGINT NOT NULL,
        \`user_id\` BIGINT NOT NULL,
        \`content\` TEXT NOT NULL,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`idx_task_comments_task_created\` (\`task_id\`, \`created_at\`),
        CONSTRAINT \`FK_task_comments_task_id\` FOREIGN KEY (\`task_id\`) REFERENCES \`tasks\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`FK_task_comments_user_id\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`task_attachments\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`task_id\` BIGINT NOT NULL,
        \`uploaded_by\` BIGINT NOT NULL,
        \`file_url\` VARCHAR(500) NOT NULL,
        \`file_name\` VARCHAR(255) NOT NULL,
        \`file_size\` INT NOT NULL,
        \`mime_type\` VARCHAR(100) NOT NULL,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`idx_task_attachments_task_id\` (\`task_id\`),
        CONSTRAINT \`FK_task_attachments_task_id\` FOREIGN KEY (\`task_id\`) REFERENCES \`tasks\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`FK_task_attachments_uploaded_by\` FOREIGN KEY (\`uploaded_by\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`task_attachments\`;`);
    await queryRunner.query(`DROP TABLE \`task_comments\`;`);
  }
}
