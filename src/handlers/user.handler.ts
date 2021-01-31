import { UserEventPublishersFactory } from '../publishers';
import { User } from '../users/user.entity';
import * as Event from '../events';
import { DeleteUserEventDto, UpdatePasswordEventDto, UpdateUserAdditionalInfoPublishDto } from '../users/dto';

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

  /**
   * @description Update user additional information
   * @public
   * @param {UpdateUserAdditionalInfoPublishDto} updateUserAdditionalInfoPublishDto
   * @returns {void}
   */
  public updateUserAdditionalInfo(updateUserAdditionalInfoPublishDto: UpdateUserAdditionalInfoPublishDto) {
    const pubExchanges: string[] = [this.onepieceTripExchange];
    pubExchanges.forEach((exchange: string) => {
      UserEventPublishersFactory.createPub(
        {
          type: Event.UserEvent.UPDATEUSERADDITIONALINFO,
          data: updateUserAdditionalInfoPublishDto,
        },
        exchange,
      );
    });
  }

  /**
   * @description Soft delete user event
   * @public
   * @param {DeleteUserEventDto} deleteUserEventDto
   * @returns {void}
   */
  public softDeleteUser(deleteUserEventDto: DeleteUserEventDto): void {
    const pubExchanges: string[] = [this.onepieceTripExchange];
    pubExchanges.forEach((exchange: string) => {
      UserEventPublishersFactory.createPub(
        {
          type: Event.UserEvent.SOFTDELETEUSER,
          data: deleteUserEventDto,
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
  static createUser(user: User): void {
    return new UserHandler().createUser(user);
  }

  /**
   * @description Update user password event
   * @static
   * @public
   * @param {UpdatePasswordEventDto} updatePasswordEventDto
   * @returns {void}
   */
  static updateUserPassword(updatePasswordEventDto: UpdatePasswordEventDto): void {
    return new UserHandler().updateUserPassword(updatePasswordEventDto);
  }

  /**
   * @description Update user additional information
   * @static
   * @public
   * @param {UpdateUserAdditionalInfoPublishDto} updateUserAdditionalInfoPublishDto
   * @returns {void}
   */
  static updateUserAdditionalInfo(updateUserAdditionalInfoPublishDto: UpdateUserAdditionalInfoPublishDto) {
    return new UserHandler().updateUserAdditionalInfo(updateUserAdditionalInfoPublishDto);
  }

  /**
   * @description Soft delete user event
   * @static
   * @public
   * @param {DeleteUserEventDto} deleteUserEventDto
   * @returns {void}
   */
  static softDeleteUser(deleteUserEventDto: DeleteUserEventDto): void {
    return new UserHandler().softDeleteUser(deleteUserEventDto);
  }
}
