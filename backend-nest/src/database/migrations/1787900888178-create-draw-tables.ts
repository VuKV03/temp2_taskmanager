import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDrawTables1787900888178 implements MigrationInterface {
  name = 'CreateDrawTables1787900888178';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`draw_sessions\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`owner_id\` BIGINT NOT NULL,
        \`name\` VARCHAR(100) NOT NULL,
        \`source_type\` VARCHAR(20) NOT NULL,
        \`source_list_id\` BIGINT NULL,
        \`status\` VARCHAR(20) NOT NULL DEFAULT 'active',
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`idx_draw_sessions_owner_id\` (\`owner_id\`),
        CONSTRAINT \`FK_draw_sessions_owner_id\` FOREIGN KEY (\`owner_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`FK_draw_sessions_source_list_id\` FOREIGN KEY (\`source_list_id\`) REFERENCES \`task_lists\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`draw_items\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`session_id\` BIGINT NOT NULL,
        \`task_id\` BIGINT NULL,
        \`label\` VARCHAR(255) NOT NULL,
        \`is_drawn\` TINYINT NOT NULL DEFAULT 0,
        \`round_number\` INT NULL,
        \`drawn_at\` DATETIME(6) NULL,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`idx_draw_items_session_id\` (\`session_id\`),
        INDEX \`idx_draw_items_session_drawn\` (\`session_id\`, \`is_drawn\`),
        CONSTRAINT \`FK_draw_items_session_id\` FOREIGN KEY (\`session_id\`) REFERENCES \`draw_sessions\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`FK_draw_items_task_id\` FOREIGN KEY (\`task_id\`) REFERENCES \`tasks\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`draw_items\`;`);
    await queryRunner.query(`DROP TABLE \`draw_sessions\`;`);
  }
}
