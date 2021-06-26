import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { AddUserEventCMD } from '../add-user-event.cmd';
import { UserEventStoreRepository } from '../../stores/user-event.store';
import { UserEvent } from '../../entities/user-event.entity';
import { AddUserEventAggregate } from '../../aggregates/add-user-event.aggregate';
import { UserResponseKafkaService } from '../../handlers/user-response.handler';
import { config } from '../../../../../config';

@CommandHandler(AddUserEventCMD)
export class AddUserEventHandler implements ICommandHandler<AddUserEventCMD> {
  private readonly logger: Logger = new Logger('AddUserEventHandler');

  public constructor(private readonly userEventStoreRepository: UserEventStoreRepository, private readonly eventPublisher: EventPublisher, private readonly userResponseKafkaService: UserResponseKafkaService) {}

  public async execute(cmd: AddUserEventCMD): Promise<UserEvent> {
    this.logger.log(JSON.stringify(cmd), 'Execute-Content');
    const event = new UserEvent();
    Object.assign(event, cmd);
    event.targets = [config.EVENT_STORE_SETTINGS.topics.tripEvent, config.EVENT_STORE_SETTINGS.topics.localeEvent, config.EVENT_STORE_SETTINGS.topics.chatEvent];
    try {
      const newEvent = await this.userEventStoreRepository.register(event);
      if (newEvent instanceof Error) {
        throw newEvent;
      }
      const newUserEvtAgg = await this.eventPublisher.mergeObjectContext(await new AddUserEventAggregate());
      newUserEvtAgg.regsiterEvent(event);
      await this.userResponseKafkaService.register({ id: newEvent.id, type: cmd.type });
      newUserEvtAgg.commit();
      return newEvent;
    } catch (error) {
      this.logger.error(error.message, '', 'Execute-Error');
      throw new Error(error);
    }
  }
}
