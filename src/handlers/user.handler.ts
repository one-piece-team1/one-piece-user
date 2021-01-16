import { AMQPHandlerFactory } from '../rabbitmq';
import { User } from '../users/user.entity';
import * as Event from '../events';

class UserHandler {
  // one server only listen to one exchange
  // seperate different event by type for different services
  private readonly onepieceTripExchange: string = 'onepiece-trip';
  private readonly onepieceArticleExchange: string = 'onepiece-article';

  /**
   * @description Create user with microservice communication by RMQ
   * @public
   * @param {User} user
   * @returns {void}
   */
  createUser(user: User) {
    const pubExchanges: string[] = [this.onepieceTripExchange];
    pubExchanges.forEach((exchange: string) => {
      AMQPHandlerFactory.createPub(
        {
          type: Event.UserEvent.CREATEUSER,
          data: user,
        },
        exchange,
      );
    });
  }
}

/**
 * @classdesc RMQ user publish factory
 */
export class UserHandlerFactory {
  /**
   * @description Create user with microservice communication by RMQ
   * @public
   * @param {user} User
   * @returns {void}
   */
  static createUser(user: User) {
    return new UserHandler().createUser(user);
  }
}
