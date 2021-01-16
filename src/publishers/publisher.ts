import * as amqp from 'amqplib/callback_api';
import { Injectable, Logger } from '@nestjs/common';
import { config } from '../../config';

@Injectable()
export class UserEventPublishers {
  private logger = new Logger('UserEventPublishers');

  /**
   * @description Pub Data
   * @public
   * @param {any} message
   * @param {string | undefined} exchangeName
   * @returns {Promise<unknown>}
   */
  publishData(message: any, exchangeName: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      amqp.connect(`${config.EVENT_STORE_SETTINGS.protocol}://${config.EVENT_STORE_SETTINGS.hostname}:${config.EVENT_STORE_SETTINGS.tcpPort}/?heartbeat=60`, (connectErr: Error, connection: amqp.Connection) => {
        if (connectErr) return reject(connectErr.message);

        connection.createChannel((createChErr: Error, channel: amqp.Channel) => {
          if (createChErr) return reject(createChErr.message);

          channel.assertExchange(exchangeName, 'fanout', {
            durable: false,
          });
          channel.publish(exchangeName, '', Buffer.from(JSON.stringify(message)));
          resolve(true);
          this.logger.log(JSON.stringify(message), 'UserEventPublishers-PublishData');
        });
      });
    });
  }
}

export class UserEventPublishersFactory {
  /**
   * @description Pub Data
   * @public
   * @param {any} message
   * @param {string | undefined} exchangeName
   * @returns {Promise<unknown>}
   */
  static createPub(message: any, exchangeName: string) {
    return new UserEventPublishers().publishData(message, exchangeName);
  }
}
