import { Injectable, Logger } from '@nestjs/common';
import Kafka from 'node-rdkafka';
import { config } from '../../config';

@Injectable()
export class UserKafkaProudcerService {
  private readonly logger: Logger = new Logger('UserKafkaProudcerService');

  private readonly producer = new Kafka.Producer({
    'bootstrap.servers': config.EVENT_STORE_SETTINGS.bootstrapServers,
  });

  constructor() {
    this.init();
  }

  init() {
    this.producer
      .on('ready', (info, metadata) => {
        this.logger.log(`${info.name} is ready for ${JSON.stringify(metadata)}`, 'Ready');
      })
      .on('event.event', (evtData) => {
        this.logger.log(evtData, 'Event_data');
      })
      .on('event.error', (err) => {
        this.logger.error(err.message, '', 'Event-Error');
      })
      .on('delivery-report', (err, report) => {
        if (err) this.logger.error(err.message, '', 'Delivery-Error');
        this.logger.log(JSON.stringify(report), 'Delivery-Report');
      });
    process.on('SIGINT', () => {
      this.producer.disconnect((err) => {
        if (err) process.exit(1);
        process.exit(0);
      });
    });
    this.producer.connect();
    this.producer.setPollInterval(100);
  }

  /**
   * @description Produce Event
   * @public
   * @param {string} topic
   * @param {T} message
   * @param {string} id
   * @returns {unknown}
   */
  public produce<T>(topic: string, message: T, id: string) {
    return this.producer.produce(topic, null, Buffer.from(JSON.stringify(message)), id, Date.now());
  }
}
