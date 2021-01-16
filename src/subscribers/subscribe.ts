import { Injectable, Logger } from '@nestjs/common';
import { AMQPHandlerFactory } from '../rabbitmq';
import * as Event from '../events';
import { TripRepository } from '../trips/trip.repository';
import { Trip } from '../trips/trip.entity';

interface IReceiveEvent {
  type: Event.TripEvent;
  data: Trip;
}

/**
 * @classdesc RMQ user event subscribe
 */
@Injectable()
export class UserEventSubscribers {
  private readonly logger: Logger = new Logger('UserEventSubscribers');
  // one server only listen to one exchange
  // seperate different event by type for different services
  private readonly onepieceUserExchange: string = 'onepiece-user';

  constructor(private readonly tripRepository: TripRepository) {
    this.listen();
  }

  /**
   * @description listen to RMQ sub event
   */
  listen() {
    AMQPHandlerFactory.createSub('onepiece_user_queue', this.onepieceUserExchange)
      .then((event) => this.execute(event))
      .catch((err) => this.logger.log(err.message));
  }

  /**
   * @description Excute sub event and assign to responsable repository handler
   * @param {string} event
   */
  execute(event) {
    const jsonEvent: IReceiveEvent = JSON.parse(event);
    switch (jsonEvent.type) {
      case Event.TripEvent.CREATETRIP:
        return this.tripRepository.createTrip(jsonEvent.data);
    }
  }
}
