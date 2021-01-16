import { UserEventPublishersFactory } from '../publishers';
import { User } from '../users/user.entity';
import * as Event from '../events';
import { UpdatePasswordEventDto } from '../users/dto';

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
  public createUser(user: User): void {
    const pubExchanges: string[] = [this.onepieceTripExchange];
    pubExchanges.forEach((exchange: string) => {
      UserEventPublishersFactory.createPub(
        {
          type: Event.UserEvent.CREATEUSER,
          data: user,
        },
        exchange,
      );
    });
  }

  /**
   * @description Update user password event
   * @public
   * @param {UpdatePasswordEventDto} updatePasswordEventDto
   * @returns {void}
   */
  public updateUserPassword(updatePasswordEventDto: UpdatePasswordEventDto): void {
    const pubExchanges: string[] = [this.onepieceTripExchange];
    pubExchanges.forEach((exchange: string) => {
      UserEventPublishersFactory.createPub(
        {
          type: Event.UserEvent.UPDATEUSERPASSWORD,
          data: updatePasswordEventDto,
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
   * @static
   * @public
   * @param {user} User
   * @returns {void}
   */
  static createUser(user: User) {
    return new UserHandler().createUser(user);
  }

  /**
   * @description Update user password event
   * @static
   * @public
   * @param {UpdatePasswordEventDto} updatePasswordEventDto
   * @returns {void}
   */
  static updateUserPassword(updatePasswordEventDto: UpdatePasswordEventDto) {
    return new UserHandler().updateUserPassword(updatePasswordEventDto);
  }
}
