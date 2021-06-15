import { HttpException, HttpStatus, Injectable, Logger, NotAcceptableException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import Redis from 'ioredis';
import { nanoid } from 'nanoid';
import * as nodemailer from 'nodemailer';
import { User } from './user.entity';
import { UserEvent } from '../domains/user-events/entities/user-event.entity';
import { UserRepository } from './user.repository';
import { UserHandlerFactory } from '../handlers';
import { UploadeService } from './uploads/cloudinary.service';
import HTTPResponse from '../libs/response';
import { AddUserEventCMD } from '../domains/user-events/commands/add-user-event.cmd';
import { SigninCreditDto, UserCreditDto, UserForgetDto, VerifyKeyDto, VerifyUpdatePasswordDto, UserUpdatePassDto, UpdateSubscription, UpdateUserAdditionalInfoInServerDto, UserSearchDto } from './dto';
import * as IShare from '../interfaces';
import * as EUser from './enums';
import * as IUser from './interfaces';
import { config } from '../../config';

@Injectable()
export class UserService {
  private readonly httpResponse: HTTPResponse = new HTTPResponse();
  private readonly logger: Logger = new Logger('UserService');
  public readonly redisClient: Redis.Redis = new Redis(config.REDIS_URL);
  constructor(
    @InjectRepository(UserRepository)
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly uploadService: UploadeService,
    private readonly comandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * @description Sign up user service action
   * @public
   * @param {UserCreditDto} userCreditDto
   * @returns {Promise<IShare.IResponseBase<User> | HttpException>}
   */
  public async signUp(userCreditDto: UserCreditDto, requestId?: string): Promise<IShare.IResponseBase<string> | IShare.IEventApiResponse<string> | HttpException> {
    let event!: UserEvent;
    try {
      if (requestId) {
        event = <UserEvent>await this.comandBus.execute<AddUserEventCMD>(new AddUserEventCMD(requestId, EUser.EUserApiEventActionName.SIGNUP, [userCreditDto]));
        const user = await this.userRepository.signUp(userCreditDto);
        UserHandlerFactory.createUser(user);
        return this.httpResponse.StatusCreated<string>('signup success', event.id);
      }
      const user = await this.userRepository.signUp(userCreditDto);
      UserHandlerFactory.createUser(user);
      return this.httpResponse.StatusCreated<string>('signup success');
    } catch (error) {
      this.logger.error(error.message, '', 'SignUpError');
      if (requestId) {
        return this.httpResponse.InternalServerError<string>(error.message, event.id);
      }
      return new HttpException(
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
   * @returns {Promise<IShare.IResponseBase<string> | HttpException>}
   */
  public async signIn(signinCreditDto: SigninCreditDto): Promise<IShare.IResponseBase<string> | HttpException> {
    try {
      const user = await this.userRepository.validateUserPassword(signinCreditDto);
      if (!user) {
        this.logger.error('Invalid credentials', '', 'SignInError');
        return new HttpException(
          {
            status: HttpStatus.UNAUTHORIZED,
            error: 'Invalid credentials',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }
      const payload: IUser.JwtPayload = {
        id: user.id,
        username: user.username,
        role: user.role,
        licence: 'onepiece',
      };
      const accessToken = await this.jwtService.sign(payload);
      return this.httpResponse.StatusOK<string>(accessToken);
    } catch (error) {
      this.logger.error(error.message, '', 'SignInError');
      return new HttpException(
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
  public getUser(user: IUser.UserInfo): IShare.IResponseBase<{ user: IUser.JwtPayload }> | HttpException {
    if (!user) {
      this.logger.error('No user existed', '', 'GetUserError');
      return new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          error: 'No user existed',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.httpResponse.StatusOK<{ user: IUser.JwtPayload }>({ user: { id: user.id, role: user.role, username: user.username, licence: user.licence || 'onepiece', email: user.email } });
  }

  /**
   * @description Get users by information
   * @public
   * @param {IUser.UserInfo | IUser.JwtPayload} user
   * @param {UserSearchDto} searchDto
   * @returns {Promise<IShare.IResponseBase<IShare.IUsersPagingResponseBase<User[]>> | HttpException>}
   */
  public async getUsers(user: IUser.UserInfo | IUser.JwtPayload, searchDto: UserSearchDto): Promise<IShare.IResponseBase<IShare.IUsersPagingResponseBase<User[]>> | HttpException> {
    try {
      if (!searchDto.keyword) searchDto.keyword = '';
      if (!searchDto.sort) searchDto.sort = 'DESC';
      const isAdmin = user.role === EUser.EUserRole.ADMIN;
      const { users, count, take, skip } = await this.userRepository.getUsers(searchDto, isAdmin);

      if (!users || !count) {
        this.logger.error('User Not Found', '', 'GetUsersError');
        return new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'User Not Found',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return this.httpResponse.StatusOK({ users, take, skip, count });
    } catch (error) {
      this.logger.error(error.message, '', 'GetUsersError');
      return new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * @description Get User by id
   * @public
   * @param {string} id
   * @param {IUser.UserInfo | IUser.JwtPayload} reqUser
   * @returns {Promise<IShare.IResponseBase<{ user: User }> | HttpException>}
   */
  public async getUserById(id: string, reqUser: IUser.UserInfo | IUser.JwtPayload): Promise<IShare.IResponseBase<{ user: User }> | HttpException> {
    try {
      const isAdmin = reqUser.role === EUser.EUserRole.ADMIN;
      const user = await this.userRepository.getUserById(id, isAdmin);
      if (!user) {
        this.logger.error(`User ${id} not found`, '', 'GetUserByidError');
        return new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: `User ${id} not found`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return this.httpResponse.StatusOK<{ user: User }>({ user });
    } catch (error) {
      this.logger.error(error.message, '', 'GetUserByidError');
      return new HttpException(
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
   * @returns {Promise<IShare.IResponseBase<{ user: IUser.UserInfo }> | HttpException>}
   */
  public async googleLogin(user: IUser.UserInfo): Promise<IShare.IResponseBase<{ user: IUser.UserInfo }> | HttpException> {
    // if google login redirect not success throw Exception
    if (!user) {
      this.logger.error('No user existed', '', 'GoogleLoginError');
      return new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          error: 'No user existed',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    // if login success check for third party login repo process
    // check if user existed or not
    // if existed then not create new user
    // if not existed create new user
    const signUpResult = await this.userRepository.thirdPartySignUp({
      username: user.username,
      email: user.email,
    });

    if (typeof signUpResult.id !== 'string' && typeof signUpResult.tempPass !== 'string') {
      this.logger.error('Google signup provider failed', '', 'GoogleLoginError');
      return new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Google signup provider failed',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    const mail_result = await this.mailSender(user, 'google', signUpResult.tempPass);
    if (!mail_result) {
      this.logger.error('Google signup mail failed', '', 'GoogleLoginError');
      return new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Google signup mail failed',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    user.id = signUpResult.id;
    return this.httpResponse.StatusOK<{ user: IUser.UserInfo }>({ user });
  }

  /**
   * @description Get user information from facebook login callback redirect
   * @public
   * @param {IUser.UserInfo} user
   * @returns {Promise<IShare.IResponseBase<{ user: IUser.UserInfo }> | HttpException>}
   */
  public async fbLogin(user: IUser.UserInfo): Promise<IShare.IResponseBase<{ user: IUser.UserInfo }> | HttpException> {
    if (!user) {
      this.logger.error('No user existed', '', 'GoogleLoginError');
      return new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          error: 'No user existed',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    // if login success check for third party login repo process
    // check if user existed or not
    // if existed then not create new user
    // if not existed create new user
    const signUpResult = await this.userRepository.thirdPartySignUp({
      username: user.username,
      email: user.email,
    });

    if (typeof signUpResult.id !== 'string' && typeof signUpResult.tempPass !== 'string') {
      this.logger.error('Facebook signup provider failed', '', 'FacebookLoginError');
      return new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Facebook signup provider failed',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    const mail_result = await this.mailSender(user, 'facebook', signUpResult.tempPass);
    if (!mail_result) {
      this.logger.error('Facebook signup mail failed', '', 'FacebookLoginError');
      return new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Facebook signup mail failed',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    user.id = signUpResult.id;
    return this.httpResponse.StatusOK<{ user: IUser.UserInfo }>({ user });
  }

  /**
   * @description Create user forget password first steps
   * @public
   * @param {UserForgetDto} userForgetDto
   * @returns {Promise<IShare.IResponseBase<string> | HttpException>}
   */
  public async createUserForget(userForgetDto: UserForgetDto): Promise<IShare.IResponseBase<string> | HttpException> {
    try {
      const user: User = await this.userRepository.createUserForget(userForgetDto);
      if (!user) {
        this.logger.error('No user existed', '', 'CreateUserForgetError');
        return new HttpException(
          {
            status: HttpStatus.UNAUTHORIZED,
            error: 'No user existed',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }
      const mail_result = await this.mailSender(user, 'forget');
      if (!mail_result) {
        this.logger.error('User forget mail failed', '', 'CreateUserForgetError');
        return new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'User forget mail failed',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      return this.httpResponse.StatusOK<string>('Send mail success');
    } catch (error) {
      this.logger.error(error.message, '', 'CreateUserForgetError');
      return new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * @description Mail Handler
   * @public
   * @param {User | IUser.UserInfo} user
   * @param {IUser.TMailType} type
   * @returns {Promise<unknown>}
   */
  public async mailSender(user: User | IUser.UserInfo, type: IUser.TMailType): Promise<unknown>;
  public async mailSender(user: User | IUser.UserInfo, type: IUser.TMailType, tempPass: string): Promise<unknown>;
  public async mailSender(user: User | IUser.UserInfo, type: IUser.TMailType, tempPass?: string): Promise<unknown> {
    /* istanbul ignore next */
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.GOOGLE.USER,
          pass: config.GOOGLE.PASS,
        },
      });

      if (type === 'forget') {
        const verify_key = nanoid(6);
        this.redisClient.set(verify_key, `${user.id}`, 'EX', 300);
        return await transporter.sendMail({
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
      }

      if (typeof tempPass === 'string') {
        return await transporter.sendMail({
          to: user.email,
          from: 'noreply@onepiece.com',
          subject: 'Welcome to OnePiece society',
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
                    Welcome to OnePiece society. We are honor to have you in the community.
                  </td>
                </tr>
                <tr>
                  <td class="bodycopy" style="font-size: 16px; line-height: 22px;">
                    Due to you have register with ${type} authentication. We create a temporary password 
                    <span style="background-color: #FFFF00">${tempPass}</span>
                    for you. Please remember to update the password.
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
      }
    } catch (error) {
      this.logger.error(error.message, '', 'MailHandlerError');
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
  public async validateVerifyKey(verifyKeyDto: VerifyKeyDto): Promise<IShare.IResponseBase<string> | HttpException> {
    const key_result = await this.redisClient.get(verifyKeyDto.key);
    if (!key_result) {
      this.logger.error('Invalid verify key', '', 'ValidateVerifyKeyError');
      return new HttpException(
        {
          status: HttpStatus.NOT_ACCEPTABLE,
          error: 'Invalid verify key',
        },
        HttpStatus.NOT_ACCEPTABLE,
      );
    }
    return this.httpResponse.StatusOK<string>('Verify success');
  }

  /**
   * @description Verify user update password
   * @public
   * @param {VerifyUpdatePasswordDto} verifyUpdatePasswordDto
   * @returns {Promise<IShare.IResponseBase<string> | HttpException>}
   */
  public async verifyUpdatePassword(verifyUpdatePasswordDto: VerifyUpdatePasswordDto): Promise<IShare.IResponseBase<string> | HttpException> {
    try {
      const id = await this.redisClient.get(verifyUpdatePasswordDto.key);
      if (!id) {
        this.logger.error('Invalid validate key', '', 'VerifyUpdatePasswordError');
        return new HttpException(
          {
            status: HttpStatus.NOT_ACCEPTABLE,
            error: 'Invalid validate key',
          },
          HttpStatus.NOT_ACCEPTABLE,
        );
      }
      const user = await this.userRepository.verifyUpdatePassword(verifyUpdatePasswordDto, id);
      if (!user) {
        this.logger.error('Renew new password failed', '', 'VerifyUpdatePasswordError');
        return new HttpException(
          {
            status: HttpStatus.CONFLICT,
            error: 'Renew new password failed',
          },
          HttpStatus.CONFLICT,
        );
      }
      UserHandlerFactory.updateUserPassword({ id, salt: user.salt, password: user.password });
      return this.httpResponse.StatusOK<string>('update password success');
    } catch (error) {
      this.logger.error(error.message, '', 'VerifyUpdatePasswordError');
      return new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * @description Update user password
   * @public
   * @param {UserUpdatePassDto} userUpdatePassword
   * @param {string} id
   * @param {string} tokenId
   * @returns {Promise<IShare.IResponseBase<string> | HttpException>}
   */
  public async userUpdatePassword(userUpdatePassword: UserUpdatePassDto, id: string, tokenId: string): Promise<IShare.IResponseBase<string> | HttpException> {
    try {
      if (id !== tokenId) {
        this.logger.error('Invalid Id request', '', 'UserUpdatePasswordError');
        return new HttpException(
          {
            status: HttpStatus.FORBIDDEN,
            error: 'Invalid Id request',
          },
          HttpStatus.FORBIDDEN,
        );
      }
      const user = await this.userRepository.userUpdatePassword(userUpdatePassword, id);
      if (!user) {
        this.logger.error('User not found', '', 'UserUpdatePasswordError');
        return new HttpException(
          {
            status: HttpStatus.FORBIDDEN,
            error: 'User not found',
          },
          HttpStatus.FORBIDDEN,
        );
      }
      UserHandlerFactory.updateUserPassword({ id, salt: user.salt, password: user.password });
      return this.httpResponse.StatusOK<string>('Update password success');
    } catch (error) {
      this.logger.error(error.message, '', 'UserUpdatePasswordError');
      return new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * @description Update subscribe plan
   * @deprecated
   * @public
   * @param {UpdateSubscription} updateSubPlan
   * @param {string} id
   * @param {string} tokenId
   * @returns {Promise<IUser.ResponseBase>}
   */
  /* istanbul ignore next */
  public async updateSubscribePlan(updateSubPlan: UpdateSubscription, id: string, tokenId: string): Promise<IUser.ResponseBase> {
    try {
      if (id !== tokenId) throw new UnauthorizedException('Invalid Id request');
      // if (updateSubPlan.role === EUser.EUserRole.ADMIN || updateSubPlan.role === EUser.EUserRole.TRIAL)
      return await this.userRepository.updateSubscribePlan(updateSubPlan, id);
    } catch (error) {
      this.logger.log(error.message, 'UpdateSubscribePlan');
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
   * @description Update additional user info
   * @public
   * @param {UpdateUserAdditionalInfoInServerDto} updateUserInfoDto
   * @param {string} id
   * @param {string} tokenId
   * @returns {Promise<IShare.IResponseBase<User> | HttpException>}
   */
  public async updateUserAdditionalInfo(updateUserInfoDto: UpdateUserAdditionalInfoInServerDto, id: string, tokenId: string): Promise<IShare.IResponseBase<User> | HttpException> {
    if (id !== tokenId) {
      this.logger.error('Invalid Id request', '', 'UpdateUserAdditionalInfoError');
      return new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'Invalid Id request',
        },
        HttpStatus.FORBIDDEN,
      );
    }
    const { files } = updateUserInfoDto;
    /* istanbul ignore next */
    if (files) {
      this.uploadService.uploadBatch(files);
    }
    try {
      const userResult = await this.userRepository.updateUserAdditionalInfo(updateUserInfoDto, id);
      if (!userResult) {
        this.logger.error('Update user additional information failed', '', 'UpdateUserAdditionalInfoError');
        return new HttpException(
          {
            status: HttpStatus.CONFLICT,
            error: 'Update user additional information failed',
          },
          HttpStatus.CONFLICT,
        );
      }
      UserHandlerFactory.updateUserAdditionalInfo({
        id: userResult.id,
        gender: userResult.gender,
        age: userResult.age,
        desc: userResult.desc,
        profileImage: userResult.profileImage,
      });
      return this.httpResponse.StatusOK<User>(userResult);
    } catch (error) {
      this.logger.error(error.message, '', 'UpdateUserAdditionalInfoError');
      return new HttpException(
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
   * @param {string} tokenId
   * @returns {Promise<IShare.IResponseBase<unknown> | HttpException>}
   */
  public async softDeleteUser(id: string, tokenId: string): Promise<IShare.IResponseBase<unknown> | HttpException> {
    try {
      if (id !== tokenId) {
        this.logger.error('Invalid Id request', '', 'SoftDeleteUserError');
        return new HttpException(
          {
            status: HttpStatus.FORBIDDEN,
            error: 'Invalid Id request',
          },
          HttpStatus.FORBIDDEN,
        );
      }
      const result = await this.userRepository.softDeleteUser(id);
      if (!result) {
        this.logger.error('Soft delete user failed', '', 'SoftDeleteUserError');
        return new HttpException(
          {
            status: HttpStatus.CONFLICT,
            error: 'Soft delete user failed',
          },
          HttpStatus.CONFLICT,
        );
      }
      UserHandlerFactory.softDeleteUser({ id });
      return this.httpResponse.StatusNoContent();
    } catch (error) {
      this.logger.error(error.message, '', 'SoftDeleteUserError');
      return new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * @description Log out an user
   * @public
   * @param {string} token
   * @returns {Promise<IShare.IResponseBase<string> | HttpException>}
   */
  public async logOut(token: string): Promise<IShare.IResponseBase<string> | HttpException> {
    try {
      await this.redisClient.lpush('blacklist', token);
      return this.httpResponse.StatusOK<string>('Logout success');
    } catch (error) {
      this.logger.error(error.message, '', 'LogOutError');
      return new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
