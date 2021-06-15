import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { ReseponseUserEventCMD } from '../response-user-event.cmd';
import { UserEventStoreRepository } from '../../stores/user-event.store';
import { UserEvent } from '../../entities/user-event.entity';
import { ResponseUserEventAggregate } from '../../aggregates/response-user-event.aggregate';

@CommandHandler(ReseponseUserEventCMD)
export class ResponseUserEventHandler implements ICommandHandler<ReseponseUserEventCMD> {
  private readonly logger: Logger = new Logger('ResponseUserEventHandler');

  public constructor(private readonly userEventStoreRepository: UserEventStoreRepository, private readonly eventPublisher: EventPublisher) {}

  public async execute(cmd: ReseponseUserEventCMD): Promise<UserEvent> {
    this.logger.log(JSON.stringify(cmd), 'Execute-Content');
    Object.assign(cmd, { status: true });
    try {
      const receiveEvent = await this.userEventStoreRepository.register(cmd as UserEvent, cmd.id);
      if (receiveEvent instanceof Error) {
        throw receiveEvent;
      }
      const receiveEvtAgg = await this.eventPublisher.mergeObjectContext(await new ResponseUserEventAggregate());
      receiveEvtAgg.regsiterEvent(receiveEvent);
      receiveEvtAgg.commit();
      return receiveEvent;
    } catch (error) {
      this.logger.error(error.message, '', 'Execute-Error');
      throw new Error(error);
    }
  }
}
