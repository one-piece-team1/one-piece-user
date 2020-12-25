import {
  ConflictException,
  InternalServerErrorException,
  Logger,
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
import { User } from './user.entity';
import { UserCreditDto, UserForgetDto } from './dto/index';
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

  /**
   * @description Validate user password
   * @public
   * @param {UserCreditDto} userCreditDto
   * @returns {Promise<string>}
   */
  public async validateUserPassword(
    userCreditDto: UserCreditDto,
  ): Promise<string> {
    const { username, password } = userCreditDto;
    const user = await this.findOne({ where: { username } });
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

  public async createUserForget(userForgetDto: UserForgetDto): Promise<User> {
    const { email } = userForgetDto;
    const user = await this.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
