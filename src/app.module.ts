import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { UserModule } from './users/user.module';
import { HealthController } from './healths/health.controller';
import { EventStoreDBModule } from './domains/databases/event-store-db.module';
import { EventStoreDBProvider } from './domains/databases/event-store-db.provider';
import { ormConfig } from './config/orm.config';

@Module({
  controllers: [HealthController],
  imports: [TypeOrmModule.forRoot(ormConfig), UserModule, TerminusModule, EventStoreDBModule],
  providers: [...EventStoreDBProvider],
  exports: [...EventStoreDBProvider],
})
export class AppModule {}
