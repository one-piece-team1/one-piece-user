import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from '../../config';

let ormSetting: TypeOrmModuleOptions;

if (config.ENV === 'development') {
  ormSetting = {
    type: 'postgres',
    url: config.DB_SETTINGS.url,
    entities: [__dirname + '/../**/*.entity.{js,ts}'],
    migrations: [__dirname + './migration/*.ts'],
    synchronize: true,
    logging: false,
    ssl: true,
    extra: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
  };
} else {
  ormSetting = {
    type: 'postgres',
    host: config.DB_SETTINGS.host,
    port: config.DB_SETTINGS.port,
    username: config.DB_SETTINGS.username,
    password: config.DB_SETTINGS.password,
    database: config.DB_SETTINGS.database,
    entities: [__dirname + '/../**/*.entity.{js,ts}'],
    migrations: [__dirname + './migration/*.ts'],
    synchronize: true,
    logging: false,
  };
}

export const ormConfig = ormSetting;
