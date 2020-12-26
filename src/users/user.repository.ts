import {
  ConflictException,
  InternalServerErrorException,
  Logger,
  NotAcceptableException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  Repository,
  EntityRepository,
  getManager,
  EntityManager,
  Like,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { User } from './user.entity';
import {
  SigninCreditDto,
  UserCreditDto,
  UserForgetDto,
  UserThirdDto,
  VerifyUpdatePasswordDto,
} from './dto/index';
import * as IUser from './interfaces';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  private readonly repoManager: EntityManager = getManager();
  private readonly logger = new Logger('UserRepository');

  /**
   * @description Sign up user repository action
   * @public
   * @param {UserCreditDto} userCreditDto
   * @returns {Promise<IUser.ResponseBase>}
   */
  public async signUp(
    userCreditDto: UserCreditDto,
  ): Promise<IUser.ResponseBase> {
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

  public async thirdPartySignUp(
    userThirdDto: UserThirdDto,
  ): Promise<IUser.ResponseBase> {
    const { username, email } = userThirdDto;
    const user = new User();
    const tempPass = nanoid(10);
    user.username = username;
    user.email = email;
    user.salt = await bcrypt.genSalt();
    user.password = await this.hashPassword(tempPass, user.salt);
    try {
      await user.save();
    } catch (error) {
      if (error.code === '23505') {
        return {
          statusCode: 409,
          status: 'error',
          message: 'User already existed',
        };
      } else {
        return { statusCode: 500, status: 'error', message: error.message };
      }
    }
    return { statusCode: 201, status: 'success', message: tempPass };
  }

  /**
   * @description Validate user password
   * @public
   * @param {SigninCreditDto} signinCreditDto
   * @returns {Promise<string>}
   */
  public async validateUserPassword(
    signinCreditDto: SigninCreditDto,
  ): Promise<User> {
    const { email, password } = signinCreditDto;
    const user = await this.findOne({ where: { email, status: true } });
    if (user && (await user.validatePassword(password))) {
      return user;
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

  /**
   * @description Get users with pagination
   * @public
   * @param {IUser.ISearch} searchDto
   * @returns {Promise<{ users: User[]; count: number; }>}
   */
  public async getUsers(
    searchDto: IUser.ISearch,
  ): Promise<{ users: User[]; count: number }> {
    const take = searchDto.take ? Number(searchDto.take) : 10;
    const skip = searchDto.skip ? Number(searchDto.skip) : 0;

    const searchOpts: IUser.IQueryPaging = {
      take,
      skip,
      select: ['id', 'role', 'username', 'email', 'createdAt', 'updatedAt'],
    };

    if (searchDto.keyword.length > 0) {
      searchOpts.where = {
        status: true,
        username: Like('%' + searchDto.keyword + '%'),
        order: { username: 'DESC' },
      };
    }
    try {
      const [users, count] = await this.repoManager.findAndCount(
        User,
        searchOpts,
      );
      return {
        users,
        count,
      };
    } catch (error) {
      this.logger.log(error.message, 'GetUsers');
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * @description Create user forget email process
   * @public
   * @param {UserForgetDto} userForgetDto
   */
  public async createUserForget(userForgetDto: UserForgetDto): Promise<User> {
    const { email } = userForgetDto;
    const user = await this.findOne({ where: { email, status: true } });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  /**
   * @description Verify Update Password
   * @public
   * @param {VerifyUpdatePasswordDto} verifyUpdatePasswordDto
   * @param {string} id
   * @returns {Promise<IUser.ResponseBase>}
   */
  public async verifyUpdatePassword(
    verifyUpdatePasswordDto: VerifyUpdatePasswordDto,
    id: string,
  ): Promise<IUser.ResponseBase> {
    try {
      const user = await this.findOne({ where: { id, status: true } });
      user.salt = await bcrypt.genSalt();
      user.password = await this.hashPassword(
        verifyUpdatePasswordDto.password,
        user.salt,
      );
      await user.save();
      return {
        statusCode: 200,
        status: 'success',
        message: 'update password success',
      };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  /**
   * @description Soft delete user
   * @public
   * @param {string} id
   * @returns {Promise<IUser.ResponseBase>}
   */
  public async softDeleteUser(id: string): Promise<IUser.ResponseBase> {
    try {
      const user = await this.findOne({ where: { id, status: true } });
      if (!user) throw new NotAcceptableException();
      user.status = false;
      await user.save();
      return {
        statusCode: 200,
        status: 'success',
        message: 'update password success',
      };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}
