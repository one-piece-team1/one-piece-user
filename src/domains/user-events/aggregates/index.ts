import { AddUserEventAggregate } from './add-user-event.aggregate';
import { ResponseUserEventAggregate } from './response-user-event.aggregate';

export const UserEventAggreages = [AddUserEventAggregate, ResponseUserEventAggregate];
