import { AggregateRoot } from '@nestjs/cqrs';
import { AddUserEventCMD } from '../commands/add-user-event.cmd';
import { UserEvent } from '../entities/user-event.entity';

export class AddUserEventAggregate extends AggregateRoot {
  constructor() {
    super();
  }

  public regsiterEvent(event: UserEvent) {
    this.apply(new AddUserEventCMD(event.type, event.data));
  }
}
