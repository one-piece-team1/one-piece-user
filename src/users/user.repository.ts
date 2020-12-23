import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Repository, EntityRepository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { UserCreditDto } from './dto/index';
import * as IUser from './interfaces';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  /**
   * @description Sign up user repository action
   * @public
   * @param {UserCreditDto} userCreditDto
   * @returns {Promise<IUser.ResponseBase>}
   */
  async signUp(userCreditDto: UserCreditDto): Promise<IUser.ResponseBase> {
    const { username, email, password } = userCreditDto;
    const user = new User();
    user.username = username;
    user.email = email;
    user.salt = await bcrypt.genSalt();
    user.password = await this.hashPassword(password, user.salt);
    try {
      await user.save();
    } catch (error) {
      if (error.code === '23505') {
        // throw 409 error when duplicate username
        throw new ConflictException(
          `Username: ${username} or Email: ${email} already exists`,
        );
      } else {
        throw new InternalServerErrorException();
      }
    }
    return { statusCode: 201, status: 'success', message: 'signup success' };
  }

  /**
   * @description Validate user password
   * @public
   * @param {UserCreditDto} userCreditDto
   * @returns {Promise<string>}
   */
  async validateUserPassword(userCreditDto: UserCreditDto): Promise<string> {
    const { username, password } = userCreditDto;
    const user = await this.findOne({ username });
    if (user && (await user.validatePassword(password))) {
      return user.username;
    } else {
      return null;
    }
  }

  /**
   * @description hash password
   * @private
   * @param {string} password
   * @param {string} string
   * @returns {Promise<string>}
   */
  private async hashPassword(password: string, salt: string): Promise<string> {
    return bcrypt.hash(password, salt);
  }
}
