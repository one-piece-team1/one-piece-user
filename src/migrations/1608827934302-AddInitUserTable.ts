import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { config } from '../../config';

export class AddInitUserTable1608827934302 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: config.DB_SETTINGS.userTable,
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'role',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'username',
            type: 'varchar',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'email',
            type: 'varchar',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'password',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'salt',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'time with time zone',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'time with time zone',
            isNullable: false,
          },
        ],
      }),
      false,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query(`DROP TABLE ${config.DB_SETTINGS.userTable}`);
  }
}
