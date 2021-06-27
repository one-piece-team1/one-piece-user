import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { UpdateUserPasswordEvent } from '../update-password-event.cmd';
import { UserEventStoreRepository } from '../../stores/user-event.store';
import { UserEvent } from '../../entities/user-event.entity';
import { UpdatePasswordEventAggregate } from '../../aggregates/update-password-event.aggregate';
import { UserResponseKafkaService } from '../../handlers/user-response.handler';
import { config } from '../../../../../config';

@CommandHandler(UpdateUserPasswordEvent)
export class UpdateUserPasswordHandler implements ICommandHandler<UpdateUserPasswordEvent> {
  private readonly logger: Logger = new Logger('UpdateUserPasswordHandler');

  public constructor(private readonly userEventStoreRepository: UserEventStoreRepository, private readonly eventPublisher: EventPublisher, private readonly userResponseKafkaService: UserResponseKafkaService) {}

  public async execute(cmd: UpdateUserPasswordEvent): Promise<UserEvent> {
    this.logger.log(JSON.stringify(cmd), 'Execute-Content');
    const event = new UserEvent();
    Object.assign(event, cmd);
    event.targets = [config.EVENT_STORE_SETTINGS.topics.tripEvent, config.EVENT_STORE_SETTINGS.topics.localeEvent, config.EVENT_STORE_SETTINGS.topics.chatEvent];
    try {
      const newEvent = await this.userEventStoreRepository.register(event);
      if (newEvent instanceof Error) {
        throw newEvent;
      }
      const newUserEvtAgg = await this.eventPublisher.mergeObjectContext(await new UpdatePasswordEventAggregate());
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
