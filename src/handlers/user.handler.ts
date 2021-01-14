import { AMQPHandlerFactory } from 'rabbitmq';
import { UserCreditDto } from 'users/dto';
import * as Event from '../events';

class UserHandler {
  // one server only listen to one exchange
  // seperate different event by type for different services
  private readonly onepieceTripExchange: string = 'onepiece-trip';
  private readonly onepieceArticleExchange: string = 'onepiece-article';

  /**
   * @description Create user with microservice communication by RMQ
   * @public
   * @param {UserCreditDto} userCreditDto
   * @returns {void}
   */
  createUser(userCreditDto: UserCreditDto) {
    const { username, email, password } = userCreditDto;
    const pubExchanges: string[] = [this.onepieceTripExchange];
    pubExchanges.forEach((exchange: string) => {
      AMQPHandlerFactory.createPub(
        {
          type: Event.UserEvent.CREATEUSER,
          data: {
            username,
            email,
            password,
          },
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
   * @param {UserCreditDto} userCreditDto
   * @returns {void}
   */
  static createUser(userCreditDto: UserCreditDto) {
    return new UserHandler().createUser(userCreditDto);
  }
}
