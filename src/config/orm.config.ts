import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { config } from '../../config';

export const ormConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: config.DB_SETTINGS.host,
  port: config.DB_SETTINGS.port,
  username: config.DB_SETTINGS.username,
  password: config.DB_SETTINGS.password,
  database: config.DB_SETTINGS.database,
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  migrations: [__dirname + './migration/*.ts'],
  subscribers: [__dirname + '/../**/*.audit.{js,ts}'],
  synchronize: true,
  logging: false,
};

export const testOrmconfig = (entities): PostgresConnectionOptions => ({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: '123',
  database: 'onepiece-test',
  entities,
  synchronize: true,
  dropSchema: true,
  logging: false,
  name: 'testConnection',
});
