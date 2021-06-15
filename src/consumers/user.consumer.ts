import { Injectable, Logger } from '@nestjs/common';
import Kafka from 'node-rdkafka';
import { UserService } from '../users/user.service';
import { UserResponseKafkaService } from '../domains/user-events/handlers/user-response.handler';
import * as IShare from '../interfaces';
import * as EUser from '../users/enums';
import * as Event from '../events';
import { config } from '../../config';

interface IAPIEvent {
  id?: string;
  path?: string;
  headers?: Array<any>;
  querys?: Array<any>;
  params?: Array<any>;
  body?: Array<any>;
  files?: Array<any>;
  cookies?: Array<any>;
}

@Injectable()
export class UserKakfaConsumerService {
  private readonly logger: Logger = new Logger('UserKakfaConsumerService');
  private readonly consumer = new Kafka.KafkaConsumer(
    {
      'bootstrap.servers': config.EVENT_STORE_SETTINGS.bootstrapServers,
      'group.id': config.EVENT_STORE_SETTINGS.user.groupId,
      'enable.auto.commit': true,
    },
    {
      'auto.offset.reset': 'earliest',
    },
  );

  constructor(private readonly userService: UserService, private readonly userResponseKafkaService: UserResponseKafkaService) {
    this.init();
  }

  async register(kafkaMsg: Kafka.Message) {
    const kafkaEvt = kafkaMsg.value.toString();
    const jsonEvent: IAPIEvent = JSON.parse(kafkaEvt);
    const createUserRegex = new RegExp(Event.UserAPIEvent.CREATEUSER);
    if (createUserRegex.test(jsonEvent.path)) {
      const response = <IShare.IEventApiResponse<string>>await this.userService.signUp(jsonEvent.body[0], jsonEvent.id);
      return await this.userResponseKafkaService.register({
        id: response.id,
        requestId: jsonEvent.id,
        type: EUser.EUserApiEventActionName.SIGNUP,
        response,
      });
    }

    const updateUserPasswordRegex = new RegExp(Event.UserAPIEvent.UPDATEUSERPASSWORD);
    if (updateUserPasswordRegex.test(jsonEvent.path)) {
      console.log('updateUserPasswordRegex:', jsonEvent);
      return;
    }
  }

  /**
   * @description Init func
   */
  init() {
    this.consumer
      .on('ready', () => {
        this.consumer.subscribe([config.EVENT_STORE_SETTINGS.topics.userEvent]);
        setInterval(() => {
          this.consumer.consume(config.EVENT_STORE_SETTINGS.poolOptions.max);
        }, 1000);
      })
      .on('data', (data) => {
        this.logger.log(JSON.parse(data.value.toString()), 'Check');
        this.register(data);
        this.consumer.commit();
      })
      .on('event.error', (err) => {
        this.logger.error(err.message, '', 'Event_Error');
      })
      .on('rebalance.error', (err) => {
        this.logger.error(err.message, '', 'Reblanace_Error');
      });

    this.consumer.connect({}, (err, data) => {
      if (err) {
        this.logger.error(err.message, '', 'ConsumerConnectError');
      }
    });
  }
}
