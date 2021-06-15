import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UserKafkaProudcerService } from '../../../publishers/userevent.producer';
import { ReseponseUserEventCMD } from '../commands/response-user-event.cmd';
import * as IGeneral from '../../../interfaces'
import { config } from '../../../../config';

interface IUserResponseCommand {
  id: string;
  requestId: string;
  type: string;
  response: IGeneral.IEventApiResponse<any>;
}

class UserResponseCommand {
  public constructor(public readonly requestId: string, public readonly type: string, public readonly response: any) {}
}

@Injectable()
export class UserResponseKafkaService {
  private readonly logger: Logger = new Logger('UserResponseKafkaService');
  private readonly topic = config.EVENT_STORE_SETTINGS.topics.gateWayEvent;

  constructor(private readonly comandBus: CommandBus, private readonly userKafkaProudcerService: UserKafkaProudcerService) {}

  public async register(event: IUserResponseCommand) {
    try {
      await this.comandBus.execute(new ReseponseUserEventCMD(event.id, [event.response]));
      return this.userKafkaProudcerService.produce<UserResponseCommand>(this.topic, new UserResponseCommand(event.requestId, event.type, event.response), event.requestId);
    } catch (error) {
      this.logger.error(error.message, '', '');
      throw new Error(error.message);
    }
  }
}
