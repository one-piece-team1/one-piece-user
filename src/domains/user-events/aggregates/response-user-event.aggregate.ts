import { AggregateRoot } from '@nestjs/cqrs';
import { ReseponseUserEventCMD } from '../commands/response-user-event.cmd';
import { UserEvent } from '../entities/user-event.entity';

export class ResponseUserEventAggregate extends AggregateRoot {
  constructor() {
    super();
  }

  public regsiterEvent(event: UserEvent) {
    this.apply(new ReseponseUserEventCMD(event.id, event.response));
  }
}
