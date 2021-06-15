import { Module } from '@nestjs/common';
import { EventStoreDBProvider } from './event-store-db.provider';

@Module({
  providers: [...EventStoreDBProvider],
  exports: [...EventStoreDBProvider],
})
export class EventStoreDBModule {}
