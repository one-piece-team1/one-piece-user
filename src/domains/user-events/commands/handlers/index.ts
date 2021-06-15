import { AddUserEventHandler } from './add-user-event.handler';
import { ResponseUserEventHandler } from './response-user-event.handler';

export const UserEventStoreHandlers = [AddUserEventHandler, ResponseUserEventHandler];
