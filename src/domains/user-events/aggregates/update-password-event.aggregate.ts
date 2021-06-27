import { AggregateRoot } from '@nestjs/cqrs';
import { UpdateUserPasswordEvent } from '../commands/update-password-event.cmd';
import { UserEvent } from '../entities/user-event.entity';

export class UpdatePasswordEventAggregate extends AggregateRoot {
  constructor() {
    super();
  }

  public regsiterEvent(event: UserEvent) {
    this.apply(new UpdateUserPasswordEvent(event.type, event.data));
  }
}
