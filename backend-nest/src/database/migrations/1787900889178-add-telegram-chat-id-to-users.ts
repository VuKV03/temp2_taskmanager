import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTelegramChatIdToUsers1787900889178 implements MigrationInterface {
  name = 'AddTelegramChatIdToUsers1787900889178';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`users\`
      ADD COLUMN \`telegram_chat_id\` VARCHAR(64) NULL AFTER \`timezone\`;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`telegram_chat_id\`;`);
  }
}
