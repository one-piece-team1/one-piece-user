import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UserKafkaProudcerService } from '../../../publishers/userevent.producer';
import * as IGeneral from '../../../interfaces';
import { config } from '../../../../config';

interface IUserServiceEventCommand {
  id: string;
  type: string;
}

class UserResponseCommand {
  public constructor(public readonly id: string, public readonly type: string) {}
}

@Injectable()
export class UserResponseKafkaService {
  private readonly logger: Logger = new Logger('UserResponseKafkaService');
  private readonly topics = [config.EVENT_STORE_SETTINGS.topics.tripEvent, config.EVENT_STORE_SETTINGS.topics.localeEvent, config.EVENT_STORE_SETTINGS.topics.chatEvent];

  constructor(private readonly comandBus: CommandBus, private readonly userKafkaProudcerService: UserKafkaProudcerService) {}

  public async register(event: IUserServiceEventCommand) {
    try {
      this.topics.forEach((topic) => {
        this.userKafkaProudcerService.produce<UserResponseCommand>(topic, new UserResponseCommand(event.id, event.type), event.id);
      });
    } catch (error) {
      this.logger.error(error.message, error.message, '');
      throw new Error(error.message);
    }
  }
}
