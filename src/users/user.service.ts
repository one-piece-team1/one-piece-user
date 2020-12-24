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
  async signUp(userCreditDto: UserCreditDto): Promise<IUser.ResponseBase> {
    return this.userRepository.signUp(userCreditDto);
  }

  /**
   * @description Sign in user service action
   * @public
   * @param {UserCreditDto} userCreditDto
   * @returns {Promise<IUser.SignInResponse>}
   */
  async signIn(userCreditDto: UserCreditDto): Promise<IUser.SignInResponse> {
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
  getUser(user: IUser.UserInfo): IUser.ResponseBase {
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
   * @description Get user information from google login callback redirect
   * @public
   * @param {IUser.UserInfo} user
   * @returns {IUser.ResponseBase}
   */
  googleLogin(user: IUser.UserInfo): IUser.ResponseBase {
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
  fbLogin(user: IUser.UserInfo): IUser.ResponseBase {
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
