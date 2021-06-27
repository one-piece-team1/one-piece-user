import { AddUserEventAggregate } from './add-user-event.aggregate';
import { UpdatePasswordEventAggregate } from './update-password-event.aggregate';

export const UserEventAggreages = [AddUserEventAggregate, UpdatePasswordEventAggregate];
