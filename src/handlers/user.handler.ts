import { AMQPHandlerFactory } from 'rabbitmq';
import { UserCreditDto } from 'users/dto';
import * as Event from '../events';

class UserHandler {
  private readonly onepieceUserExchange = 'onepiece-user';

  /**
   * @description Create user with microservice communication by RMQ
   * @public
   * @param {UserCreditDto} userCreditDto
   * @returns {void}
   */
  createUser(userCreditDto: UserCreditDto) {
    const { username, email, password } = userCreditDto;
    AMQPHandlerFactory.createPub(
      {
        type: Event.UserEvent.CREATEUSER,
        data: {
          username,
          email,
          password,
        },
      },
      this.onepieceUserExchange,
    );
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
