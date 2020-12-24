import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { UserCreditDto } from './dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces';
import * as IUser from './interfaces';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
    private jwtService: JwtService,
  ) {}

  /**
   * @description Sign up user service action
   * @public
   * @param {UserCreditDto} userCreditDto
   * @returns {Promise<IUser.ResponseBase>}
   */
  public async signUp(
    userCreditDto: UserCreditDto,
  ): Promise<IUser.ResponseBase> {
    try {
      return await this.userRepository.signUp(userCreditDto);
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Sign Up Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * @description Sign in user service action
   * @public
   * @param {UserCreditDto} userCreditDto
   * @returns {Promise<IUser.SignInResponse>}
   */
  public async signIn(
    userCreditDto: UserCreditDto,
  ): Promise<IUser.SignInResponse> {
    try {
      const username = await this.userRepository.validateUserPassword(
        userCreditDto,
      );
      if (username === null) {
        throw new UnauthorizedException('Invalid credentials');
      } else {
        const payload: JwtPayload = { username, licence: 'onepiece' };
        const accessToken = await this.jwtService.sign(payload);

        return {
          statusCode: 200,
          status: 'success',
          message: 'signin success',
          accessToken,
        };
      }
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Sign In Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * @description Get user information
   * @public
   * @param {IUser.UserInfo} user
   * @returns {IUser.ResponseBase}
   */
  public getUser(user: IUser.UserInfo): IUser.ResponseBase {
    if (!user) {
      throw new UnauthorizedException('No user existed');
    }
    return {
      statusCode: 200,
      status: 'success',
      message: {
        user: {
          role: user.role,
          username: user.username,
          licence: user.licence || 'onepiece',
          email: user.email,
        },
      },
    };
  }

  /**
   * @description Get users by information
   * @public
   * @param {IUser.ISearch} searchDto
   * @returns {Promise<{ users: User[]; count: number; } | Error>}
   */
  public async getUsers(
    searchDto: IUser.ISearch,
  ): Promise<{ users: User[]; count: number } | Error> {
    try {
      if (!searchDto.keyword) searchDto.keyword = '';

      const { users, count } = await this.userRepository.getUsers(searchDto);

      if (!users || !count)
        return new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'User Not Found',
          },
          HttpStatus.NOT_FOUND,
        );

      return {
        users,
        count,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Get Users Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * @description Get user information from google login callback redirect
   * @public
   * @param {IUser.UserInfo} user
   * @returns {IUser.ResponseBase}
   */
  public googleLogin(user: IUser.UserInfo): IUser.ResponseBase {
    if (!user) {
      throw new UnauthorizedException('No user existed');
    }
    return {
      statusCode: 200,
      status: 'success',
      message: {
        user,
      },
    };
  }

  /**
   * @description Get user information from facebook login callback redirect
   * @public
   * @param {IUser.UserInfo} user
   * @returns {IUser.ResponseBase}
   */
  public fbLogin(user: IUser.UserInfo): IUser.ResponseBase {
    if (!user) {
      throw new UnauthorizedException('No user existed');
    }
    return {
      statusCode: 200,
      status: 'success',
      message: {
        user,
      },
    };
  }
}
