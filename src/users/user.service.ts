import { HttpException, HttpStatus, Injectable, Logger, NotAcceptableException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { nanoid } from 'nanoid';
import * as nodemailer from 'nodemailer';
import { SigninCreditDto, UserCreditDto, UserForgetDto, VerifyKeyDto, VerifyUpdatePasswordDto, UserUpdatePassDto, UpdateSubscription, UpdateUserAdditionalInfoInServerDto } from './dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces';
import * as IUser from './interfaces';
import { User } from './user.entity';
import { config } from '../../config';
import { UploadeService } from './uploads/cloudinary.service';
import { UserHandlerFactory } from 'handlers';

@Injectable()
export class UserService {
  private logger: Logger = new Logger('UserService');
  private redisClient = new Redis(config.REDIS_URL);
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
    private jwtService: JwtService,
    private uploadService: UploadeService,
  ) {}

  /**
   * @description Sign up user service action
   * @public
   * @param {UserCreditDto} userCreditDto
   * @returns {Promise<IUser.ResponseBase>}
   */
  public async signUp(userCreditDto: UserCreditDto): Promise<IUser.ResponseBase> {
    try {
      return await this.userRepository.signUp(userCreditDto);
    } catch (error) {
      this.logger.log(error.message, 'SignUp');
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
  public async signIn(signinCreditDto: SigninCreditDto): Promise<IUser.SignInResponse> {
    try {
      const user = await this.userRepository.validateUserPassword(signinCreditDto);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      } else {
        const payload: JwtPayload = {
          id: user.id,
          username: user.username,
          role: user.role,
          licence: 'onepiece',
        };
        const accessToken = await this.jwtService.sign(payload);

        return {
          statusCode: 200,
          status: 'success',
          message: 'signin success',
          accessToken,
        };
      }
    } catch (error) {
      this.logger.log(error.message, 'SignIn');
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
          id: user.id,
          role: user.role,
          username: user.username,
          licence: user.licence || 'onepiece',
          email: user.email,
          expiredDate: user.expiredDate,
        },
      },
    };
  }

  /**
   * @description Get users by information
   * @public
   * @param {IUser.ISearch} searchDto
   * @param {boolean} isAdmin
   * @returns {Promise<{ users: User[]; count: number; } | Error>}
   */
  public async getUsers(searchDto: IUser.ISearch, isAdmin: boolean): Promise<{ users: User[]; count: number } | Error> {
    try {
      if (!searchDto.keyword) searchDto.keyword = '';
      if (!searchDto.sort) searchDto.sort = 'DESC';

      const { users, count } = await this.userRepository.getUsers(searchDto, isAdmin);

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
      this.logger.log(error.message, 'GetUsers');
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
   * @description Get User by id
   * @public
   * @param {string} id
   * @param {boolean} isAdmin
   * @returns {Promise<User>}
   */
  public async getUserById(id: string, isAdmin: boolean): Promise<IUser.ResponseBase> {
    try {
      const user = await this.userRepository.getUserById(id, isAdmin);
      if (!user) throw new NotFoundException();
      return {
        statusCode: 200,
        status: 'success',
        message: {
          user,
        },
      };
    } catch (error) {
      this.logger.log(error.message, 'GetUserById');
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
   * @returns {Promise<IUser.ResponseBase>}
   */
  public async googleLogin(user: IUser.UserInfo): Promise<IUser.ResponseBase> {
    // if google login redirect not success throw Exception
    if (!user) {
      throw new UnauthorizedException('No user existed');
    }
    // if login success check for third party login repo process
    // check if user existed or not
    // if existed then not create new user
    // if not existed create new user
    const signUpResult = await this.userRepository.thirdPartySignUp({
      username: user.username,
      email: user.email,
    });

    if (signUpResult.status !== 'success') {
      return {
        statusCode: 200,
        status: 'success',
        message: {
          user,
        },
      };
    }
    const mail_result = await this.mailSender(user, 'google', signUpResult.message);
    if (!mail_result) throw new UnauthorizedException();
    user.id = signUpResult.message;
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
   * @returns {Promise<IUser.ResponseBase>}
   */
  public async fbLogin(user: IUser.UserInfo): Promise<IUser.ResponseBase> {
    if (!user) {
      throw new UnauthorizedException('No user existed');
    }
    // if login success check for third party login repo process
    // check if user existed or not
    // if existed then not create new user
    // if not existed create new user
    const signUpResult = await this.userRepository.thirdPartySignUp({
      username: user.username,
      email: user.email,
    });

    if (signUpResult.status !== 'success') {
      return {
        statusCode: 200,
        status: 'success',
        message: {
          user,
        },
      };
    }
    const mail_result = await this.mailSender(user, 'facebook', signUpResult.message);
    if (!mail_result) throw new UnauthorizedException();
    user.id = signUpResult.message;
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
  public async createUserForget(userForgetDto: UserForgetDto): Promise<IUser.ResponseBase> {
    try {
      const user: User = await this.userRepository.createUserForget(userForgetDto);
      const mail_result = await this.mailSender(user, 'forget');
      if (!mail_result) throw new UnauthorizedException();
      return {
        statusCode: 200,
        status: 'success',
        message: 'Send mail success',
      };
    } catch (error) {
      this.logger.log(error.message, 'CreateUserForget');
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
   * @description Mail Handler
   * @private
   * @param {User | IUser.UserInfo} user
   * @param {IUser.TMailType} type
   * @returns {Promise<unknown>}
   */
  private async mailSender(user: User | IUser.UserInfo, type: IUser.TMailType): Promise<unknown>;
  private async mailSender(user: User | IUser.UserInfo, type: IUser.TMailType, tempPass: string): Promise<unknown>;
  private async mailSender(user: User | IUser.UserInfo, type: IUser.TMailType, tempPass?: string): Promise<unknown> {
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
      this.logger.log(error.message, 'MailHandler');
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
  public async validateVerifyKey(verifyKeyDto: VerifyKeyDto): Promise<IUser.ResponseBase> {
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
  public async verifyUpdatePassword(verifyUpdatePasswordDto: VerifyUpdatePasswordDto): Promise<IUser.ResponseBase> {
    try {
      const id = await this.redisClient.get(verifyUpdatePasswordDto.key);
      return await this.userRepository.verifyUpdatePassword(verifyUpdatePasswordDto, id);
    } catch (error) {
      this.logger.log(error.message, 'VerifyUpdatePassword');
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
   * @description Update user password
   * @public
   * @param {UserUpdatePassDto} userUpdatePassword
   * @param {string} id
   * @param {string} tokenId
   * @returns {Promise<IUser.ResponseBase>}
   */
  public async userUpdatePassword(userUpdatePassword: UserUpdatePassDto, id: string, tokenId: string): Promise<IUser.ResponseBase> {
    try {
      if (id !== tokenId) throw new UnauthorizedException('Invalid Id request');
      return await this.userRepository.userUpdatePassword(userUpdatePassword, id);
    } catch (error) {
      this.logger.log(error.message, 'UserUpdatePassword');
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
   * @description Update subscribe plan
   * @deprecated
   * @public
   * @param {UpdateSubscription} updateSubPlan
   * @param {string} id
   * @param {string} tokenId
   * @returns {Promise<IUser.ResponseBase>}
   */
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
   * @returns {Promise<IUser.ResponseBase>}
   */
  public async updateUserAdditionalInfo(updateUserInfoDto: UpdateUserAdditionalInfoInServerDto, id: string, tokenId: string): Promise<IUser.ResponseBase> {
    if (id !== tokenId) throw new UnauthorizedException('Invalid Id request');
    const { files } = updateUserInfoDto;
    this.uploadService.uploadBatch(files);
    try {
      const user_result = await this.userRepository.updateUserAdditionalInfo(updateUserInfoDto, id);
      if (user_result !== undefined) {
        UserHandlerFactory.updateUserAdditionalInfo({
          id: user_result.id,
          gender: user_result.gender,
          age: user_result.age,
          desc: user_result.desc,
          profileImage: user_result.profileImage,
        });
      }
      return {
        statusCode: HttpStatus.CREATED,
        status: 'success',
        message: user_result,
      };
    } catch (error) {
      this.logger.log(error.message, 'UpdateUserInfo');
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
   * @param {string} tokenId
   * @returns {Promise<IUser.ResponseBase>}
   */
  public async softDeleteUser(id: string, tokenId: string): Promise<IUser.ResponseBase> {
    try {
      if (id !== tokenId) throw new UnauthorizedException('Invalid Id request');
      return await this.userRepository.softDeleteUser(id);
    } catch (error) {
      this.logger.log(error.message, 'SoftDeleteUser');
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
   * @description Log out an user
   * @public
   * @param {string} token
   * @returns {Promise<IUser.ResponseBase>}
   */
  public async logOut(token: string): Promise<IUser.ResponseBase> {
    try {
      await this.redisClient.lpush('blacklist', token);
      return {
        statusCode: 200,
        status: 'success',
        message: 'Logout success',
      };
    } catch (error) {
      this.logger.log(error.message, 'LogOut');
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
