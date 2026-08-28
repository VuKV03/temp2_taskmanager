import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthTables1787900883178 implements MigrationInterface {
  name = 'CreateAuthTables1787900883178';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`roles\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`name\` VARCHAR(50) NOT NULL,
        \`description\` VARCHAR(255) NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_roles_name\` (\`name\`)
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`role_id\` BIGINT NOT NULL,
        \`email\` VARCHAR(255) NOT NULL,
        \`password_hash\` VARCHAR(255) NOT NULL,
        \`full_name\` VARCHAR(100) NOT NULL,
        \`avatar_url\` VARCHAR(500) NULL,
        \`timezone\` VARCHAR(50) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
        \`is_active\` TINYINT NOT NULL DEFAULT 1,
        \`last_login_at\` DATETIME NULL,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`idx_users_email\` (\`email\`),
        INDEX \`idx_users_role_id\` (\`role_id\`),
        CONSTRAINT \`FK_users_role_id\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB;
    `);

    await queryRunner.query(`
      CREATE TABLE \`refresh_tokens\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`user_id\` BIGINT NOT NULL,
        \`token_hash\` VARCHAR(255) NOT NULL,
        \`device_name\` VARCHAR(100) NULL,
        \`ip_address\` VARCHAR(45) NULL,
        \`user_agent\` VARCHAR(255) NULL,
        \`expires_at\` DATETIME NOT NULL,
        \`is_revoked\` TINYINT NOT NULL DEFAULT 0,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`idx_refresh_tokens_token_hash\` (\`token_hash\`),
        INDEX \`idx_refresh_tokens_user_id\` (\`user_id\`),
        INDEX \`idx_refresh_tokens_expires_at\` (\`expires_at\`),
        CONSTRAINT \`FK_refresh_tokens_user_id\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`refresh_tokens\`;`);
    await queryRunner.query(`DROP TABLE \`users\`;`);
    await queryRunner.query(`DROP TABLE \`roles\`;`);
  }
}
