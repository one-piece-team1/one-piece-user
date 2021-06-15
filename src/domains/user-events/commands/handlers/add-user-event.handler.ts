import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { AddUserEventCMD } from '../add-user-event.cmd';
import { UserEventStoreRepository } from '../../stores/user-event.store';
import { UserEvent } from '../../entities/user-event.entity';
import { AddUserEventAggregate } from '../../aggregates/add-user-event.aggregate';

@CommandHandler(AddUserEventCMD)
export class AddUserEventHandler implements ICommandHandler<AddUserEventCMD> {
  private readonly logger: Logger = new Logger('AddUserEventHandler');

  public constructor(private readonly userEventStoreRepository: UserEventStoreRepository, private readonly eventPublisher: EventPublisher) {}

  public async execute(cmd: AddUserEventCMD): Promise<UserEvent> {
    this.logger.log(JSON.stringify(cmd), 'Execute-Content');
    const event = new UserEvent();
    Object.assign(event, cmd);
    try {
      const newEvent = await this.userEventStoreRepository.register(event);
      if (newEvent instanceof Error) {
        throw newEvent;
      }
      const newUserEvtAgg = await this.eventPublisher.mergeObjectContext(await new AddUserEventAggregate());
      newUserEvtAgg.regsiterEvent(event);
      newUserEvtAgg.commit();
      return newEvent;
    } catch (error) {
      this.logger.error(error.message, '', 'Execute-Error');
      throw new Error(error);
    }
  }
}
