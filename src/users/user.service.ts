import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotAcceptableException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { nanoid } from 'nanoid';
import * as nodemailer from 'nodemailer';
import {
  SigninCreditDto,
  UserCreditDto,
  UserForgetDto,
  VerifyKeyDto,
  VerifyUpdatePasswordDto,
} from './dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces';
import * as IUser from './interfaces';
import { User } from './user.entity';
import { config } from '../../config';

@Injectable()
export class UserService {
  private logger: Logger = new Logger('UserService');
  private redisClient = new Redis(config.REDIS_URL);
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
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * @description Sign in user service action
   * @public
   * @param {SigninCreditDto} signinCreditDto
   * @returns {Promise<IUser.SignInResponse>}
   */
  public async signIn(
    signinCreditDto: SigninCreditDto,
  ): Promise<IUser.SignInResponse> {
    try {
      const username = await this.userRepository.validateUserPassword(
        signinCreditDto,
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
          error: error.message,
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
          error: error.message,
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

  /**
   * @description Create user forget password first steps
   * @public
   * @param {UserForgetDto} userForgetDto
   * @returns
   */
  public async createUserForget(
    userForgetDto: UserForgetDto,
  ): Promise<IUser.ResponseBase> {
    try {
      const user: User = await this.userRepository.createUserForget(
        userForgetDto,
      );
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.GOOGLE.USER,
          pass: config.GOOGLE.PASS,
        },
      });
      const verify_key = nanoid(6);
      this.redisClient.set(verify_key, `${user.id}`, 'EX', 300);
      const mail_result = await transporter.sendMail({
        to: user.email,
        from: 'noreply@onepiece.com',
        subject: 'Email Verify',
        text: 'Please verify the email',
        html: `
          <tr>
            <td class="innerpadding borderbottom" style="padding: 30px 30px 30px 30px; border-bottom: 1px solid #f2eeed;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td class="h2" style="padding: 0 0 15px 0; font-size: 24px; line-height: 28px; font-weight: bold;">
                    Hello ${user.username}!
                  </td>
                </tr>
                <tr>
                  <td class="bodycopy" style="font-size: 16px; line-height: 22px;">
                    A request has been received to change to password for your OnePiece account.
                  </td>
                </tr>
                <tr>
                  <td class="bodycopy" style="font-size: 16px; line-height: 22px;">
                    Please enter code: ${verify_key} for verification in the app.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="footer" bgcolor="#44525f">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" class="footercopy">
                    CopyRight &copy; 2020 OnePiece. All Right Reserved<br />
                    <span class="hide"></span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 20px 0 0 0;">
                    <table border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="37" style="text-align: center; padding: 0 10px 0 10px;">
                          <a href="${config.COMPANY_LINK.FB}">
                            <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/210284/facebook.png" width="37" height="37" alt="Facebook" border="0" />
                          </a>
                        </td>
                        <td width="37" style="text-align: center; padding: 0 10px 0 10px;">
                          <a href="${config.COMPANY_LINK.TWITTER}">
                            <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/210284/twitter.png" width="37" height="37" alt="Twitter" border="0" />
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `,
      });
      if (!mail_result) throw new UnauthorizedException();
      return {
        statusCode: 200,
        status: 'success',
        message: 'Send mail success',
      };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * @description Validate Verify Key
   * @public
   * @param {VerifyKeyDto} verifyKeyDto
   * @returns {Promise<IUser.ResponseBase>}
   */
  public async validateVerifyKey(
    verifyKeyDto: VerifyKeyDto,
  ): Promise<IUser.ResponseBase> {
    const key_result = await this.redisClient.get(verifyKeyDto.key);
    if (!key_result) throw new NotAcceptableException();
    return {
      statusCode: 200,
      status: 'success',
      message: 'Verify success',
    };
  }

  /**
   * @description Verify user update password
   * @public
   * @param {VerifyUpdatePasswordDto} verifyUpdatePasswordDto
   * @returns {Promise<IUser.ResponseBase>}
   */
  public async verifyUpdatePassword(
    verifyUpdatePasswordDto: VerifyUpdatePasswordDto,
  ): Promise<IUser.ResponseBase> {
    try {
      const id = await this.redisClient.get(verifyUpdatePasswordDto.key);
      return await this.userRepository.verifyUpdatePassword(
        verifyUpdatePasswordDto,
        id,
      );
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * @description Soft del user
   * @public
   * @param {string} id
   * @returns {Promise<IUser.ResponseBase>}
   */
  public async softDeleteUser(id: string): Promise<IUser.ResponseBase> {
    return await this.userRepository.softDeleteUser(id);
  }
}
