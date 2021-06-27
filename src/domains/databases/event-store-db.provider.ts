import { Provider } from '@nestjs/common';
import { createConnection } from 'typeorm';
import { eventStoreConfig } from '../../config/orm.config';

export const EventStoreDBProvider: Provider[] = [
  {
    provide: 'EVENTSTORE_DB_CONNECTION',
    useFactory: async () => await createConnection(eventStoreConfig),
  },
];
