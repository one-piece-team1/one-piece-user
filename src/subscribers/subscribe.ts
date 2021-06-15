import * as amqp from 'amqplib/callback_api';
import { Injectable, Logger } from '@nestjs/common';
import { config } from '../../config';
import * as Event from '../events';
import { TripRepository } from '../trips/trip.repository';
import { Trip } from '../trips/trip.entity';
import { PostRepository } from '../posts/post.repository';
import { Post } from '../posts/post.entity';
import { UserService } from 'users/user.service';

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

interface IReceiveEvent extends IAPIEvent {
  type?: Event.TripEvent | Event.PostEvent;
  data?: Trip | Post;
}

/**
 * @classdesc RMQ user event subscribe
 */
@Injectable()
export class UserEventSubscribers {
  private readonly logger: Logger = new Logger('UserEventSubscribers');
  // one server only listen to one exchange
  // seperate different event by type for different services
  private readonly defaultExchangeName: string = 'onepiece-user';

  constructor(private readonly userService: UserService, private readonly tripRepository: TripRepository, private readonly postRepository: PostRepository) {
    this.subscribeData('onepiece_user_queue');
  }

  /**
   * @description Sub Data
   * @public
   * @param {string} queueName
   * @returns {Promise<unknown>}
   */
  subscribeData(queueName: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      amqp.connect(`${config.EVENT_STORE_SETTINGS.protocol}://${config.EVENT_STORE_SETTINGS.hostname}:${config.EVENT_STORE_SETTINGS.tcpPort}/?heartbeat=60`, (connectErr: Error, connection: amqp.Connection) => {
        if (connectErr) return reject(connectErr.message);

        connection.createChannel((createChErr: Error, channel: amqp.Channel) => {
          if (createChErr) return reject(createChErr.message);
          channel.assertExchange(this.defaultExchangeName, 'fanout', {
            durable: false,
          });

          channel.assertQueue(
            queueName,
            {
              exclusive: true,
            },
            (assertErr: Error, q: amqp.Replies.AssertQueue) => {
              if (assertErr) return reject(assertErr.message);
              channel.bindQueue(q.queue, this.defaultExchangeName, '');
              channel.consume(
                q.queue,
                (msg: amqp.Message) => {
                  if (msg.content) {
                    this.execute(msg.content.toString());
                    resolve(true);
                  }
                },
                { noAck: true },
              );
            },
          );
        });
      });
    });
  }

  /**
   * @description Excute sub event and assign to responsable repository handler
   * @param {string} event
   */
  async execute(event) {
    const jsonEvent: IReceiveEvent = JSON.parse(event);
    this.logger.log(event, 'UserEventSubscribers');
    if (jsonEvent.path) {
      const createUserRegex = new RegExp(Event.UserAPIEvent.CREATEUSER);
      if (createUserRegex.test(jsonEvent.path)) {
        const res = await this.userService.signUp(jsonEvent.body[0], jsonEvent.id);
        console.log('res', res);
        return;
      }

      const updateUserPasswordRegex = new RegExp(Event.UserAPIEvent.UPDATEUSERPASSWORD);
      if (updateUserPasswordRegex.test(jsonEvent.path)) {
        console.log('updateUserPasswordRegex:', jsonEvent);
        return;
      }
    }

    if (jsonEvent.type) {
      if (jsonEvent.type === Event.TripEvent.CREATETRIP) {
        return this.tripRepository.createTrip(jsonEvent.data as Trip);
      }
      if (jsonEvent.type === Event.PostEvent.CREATEPOST) {
        return this.postRepository.createPost(jsonEvent.data as Post);
      }
    }
  }
}
