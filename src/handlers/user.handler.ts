import { AMQPHandlerFactory } from 'rabbitmq';
import { UserCreditDto } from 'users/dto';
import * as Event from '../events';

class UserHandler {
  private readonly onepieceUserExchange = 'onepiece-user';

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

export class UserHandlerFactory {
  static createUser(userCreditDto: UserCreditDto) {
    return new UserHandler().createUser(userCreditDto);
  }
}
