import * as amqp from 'amqplib/callback_api';
import { Logger } from '@nestjs/common';
import { config } from '../../config';

export class AMQPHandler {
  private defaultExchangeName = 'onepiece-trip';
  private logger = new Logger('AMQPHandler');

  /**
   * @description Pub Data
   * @public
   * @param {any} message
   * @param {string | undefined} exchangeName
   * @returns {Promise<unknown>}
   */
  publishData(message: any): Promise<unknown>;
  publishData(message: any, exchangeName: string): Promise<unknown>;
  publishData(message: any, exchangeName?: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      amqp.connect(`${config.EVENT_STORE_SETTINGS.protocol}://${config.EVENT_STORE_SETTINGS.hostname}:${config.EVENT_STORE_SETTINGS.tcpPort}/?heartbeat=60`, (connectErr: Error, connection: amqp.Connection) => {
        if (connectErr) return reject(connectErr.message);

        connection.createChannel((createChErr: Error, channel: amqp.Channel) => {
          if (createChErr) return reject(createChErr.message);
          if (exchangeName) this.defaultExchangeName = exchangeName;

          channel.assertExchange(this.defaultExchangeName, 'fanout', {
            durable: false,
          });
          channel.publish(this.defaultExchangeName, '', Buffer.from(JSON.stringify(message)));
          this.logger.log(message, 'AMQPHandler-PublishData');
          resolve(true);
        });
      });
    });
  }

  /**
   * @description Sub Data
   * @public
   * @param {string} queueName
   * @param {string | undefined} exchangeName
   * @returns {Promise<unknown>}
   */
  subscribeData(queueName: string): Promise<unknown>;
  subscribeData(queueName: string, exchangeName: string): Promise<unknown>;
  subscribeData(queueName: string, exchangeName?: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      amqp.connect(`${config.EVENT_STORE_SETTINGS.protocol}://${config.EVENT_STORE_SETTINGS.hostname}:${config.EVENT_STORE_SETTINGS.tcpPort}/?heartbeat=60`, (connectErr: Error, connection: amqp.Connection) => {
        if (connectErr) return reject(connectErr.message);

        connection.createChannel((createChErr: Error, channel: amqp.Channel) => {
          if (createChErr) return reject(createChErr.message);
          if (exchangeName) this.defaultExchangeName = exchangeName;
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
                  this.logger.log(msg.content.toString(), 'AMQPHandler-SubscribeData');
                  if (msg.content) resolve(msg.content.toString());
                },
                { noAck: true },
              );
            },
          );
        });
      });
    });
  }
}

export class AMQPHandlerFactory {
  /**
   * @description Pub Data
   * @public
   * @param {any} message
   * @param {string | undefined} exchangeName
   * @returns {Promise<unknown>}
   */
  static createPub(message: any, exchangeName?: string) {
    return new AMQPHandler().publishData(message, exchangeName);
  }

  /**
   * @description Sub Data
   * @public
   * @param {string} queueName
   * @param {string | undefined} exchangeName
   * @returns {Promise<unknown>}
   */
  static createSub(queueName: string, exchangeName?: string) {
    return new AMQPHandler().subscribeData(queueName, exchangeName);
  }
}
