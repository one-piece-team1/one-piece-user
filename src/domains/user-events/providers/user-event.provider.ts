import { Provider } from '@nestjs/common';
import { Connection } from 'typeorm';
import { UserEvent } from '../entities/user-event.entity';

export const UserEventStoreProvider: Provider[] = [
  {
    provide: 'USEREVENT_REPOSITORY',
    useFactory: (conn: Connection) => conn.getRepository(UserEvent),
    inject: ['EVENTSTORE_DB_CONNECTION'],
  },
];
