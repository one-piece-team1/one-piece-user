import { AddUserEventHandler } from './add-user-event.handler';
import { UpdateUserPasswordHandler } from './update-password-event.handler';

export const UserEventStoreHandlers = [AddUserEventHandler, UpdateUserPasswordHandler];
