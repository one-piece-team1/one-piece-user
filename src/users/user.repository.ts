import { ConflictException, ForbiddenException, HttpException, HttpStatus, InternalServerErrorException, Logger, NotAcceptableException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Repository, EntityRepository, getManager, EntityManager, Like, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { User } from './user.entity';
import { SigninCreditDto, UpdateSubscription, UpdateUserAdditionalInfoInServerDto, UserCreditDto, UserForgetDto, UserThirdDto, UserUpdatePassDto, VerifyUpdatePasswordDto, UserSearchDto } from './dto/index';
import * as IUser from './interfaces';
import * as EUser from './enums';
import * as utils from '../libs/utils';
import { UserHandlerFactory } from '../handlers';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  private readonly repoManager: EntityManager = getManager();
  private readonly logger = new Logger('UserRepository');
  private readonly cloudinaryBaseUrl: string = 'https://res.cloudinary.com/ahoyapp/image/upload';

  /**
   * @description Sign up user repository action
   * @public
   * @param {UserCreditDto} userCreditDto
   * @returns {Promise<User>}
   */
  public async signUp(userCreditDto: UserCreditDto): Promise<User> {
    const { username, email, password } = userCreditDto;
    const user = new User();
    user.username = username;
    user.email = email;
    user.salt = await bcrypt.genSalt();
    user.password = await this.hashPassword(password, user.salt);
    user.expiredDate = utils.addMonths(new Date(Date.now()), 1);
    try {
      await user.save();
    } catch (error) {
      if (error.code === '23505') {
        // throw 409 error when duplicate username
        throw new ConflictException(`Username: ${username} or Email: ${email} already exists`);
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
    // UserHandlerFactory.createUser(user);
    return user;
  }

  /**
   * @description Third party signup
   * @public
   * @param {UserThirdDto} userThirdDto
   * @returns {Promise<string>}
   */
  public async thirdPartySignUp(userThirdDto: UserThirdDto): Promise<string> {
    const { username, email } = userThirdDto;
    const user = new User();
    const tempPass = nanoid(10);
    user.username = username;
    user.email = email;
    user.salt = await bcrypt.genSalt();
    user.password = await this.hashPassword(tempPass, user.salt);
    user.expiredDate = utils.addMonths(new Date(Date.now()), 1);
    try {
      await user.save();
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException(`Username: ${username} or Email: ${email} already exists`);
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
    UserHandlerFactory.createUser(user);
    return tempPass;
  }

  /**
   * @description Validate user password
   * @public
   * @param {SigninCreditDto} signinCreditDto
   * @returns {Promise<string>}
   */
  public async validateUserPassword(signinCreditDto: SigninCreditDto): Promise<User> {
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
   * @param {UserSearchDto} searchDto
   * @param {boolean} isAdmin
   * @returns {Promise<{ users: User[]; count: number; }>}
   */
  public async getUsers(searchDto: UserSearchDto, isAdmin: boolean): Promise<{ users: User[]; take: number; skip: number; count: number }> {
    const take = searchDto.take ? Number(searchDto.take) : 10;
    const skip = searchDto.skip ? Number(searchDto.skip) : 0;

    const searchOpts: IUser.IQueryPaging = {
      take,
      skip,
      select: ['id', 'role', 'username', 'email', 'expiredDate', 'createdAt', 'updatedAt'],
      order: {
        updatedAt: searchDto.sort,
      },
      where: {
        status: true,
      },
    };

    // only admin can view admin data
    // trial, user, vip can view each others data except admin data
    if (!isAdmin) {
      searchOpts.where.role = Not(EUser.EUserRole.ADMIN);
    }

    // keyword searching currently only support username search
    if (searchDto.keyword.length > 0) {
      searchOpts.where.username = Like('%' + searchDto.keyword + '%');
    }

    try {
      const [users, count] = await this.repoManager.findAndCount(User, searchOpts);
      return {
        users,
        take,
        skip,
        count,
      };
    } catch (error) {
      this.logger.error(error.message, '', 'GetUsersError');
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * @description Get User By Id
   * @public
   * @param {string} id
   * @param {boolean} isAdmin
   * @returns {Promise<User>}
   */
  public async getUserById(id: string, isAdmin: boolean): Promise<User> {
    try {
      const findOpts: IUser.IFindOne = {
        where: {
          id,
          status: true,
        },
      };
      // only admin can view admin data
      // trial, user, vip can view each others data except admin data
      if (!isAdmin) findOpts.where.role = Not('admin');

      const user: User = await this.findOne(findOpts);
      if (!user) return null;
      delete user.password;
      delete user.salt;
      return user;
    } catch (error) {
      this.logger.error(error.message, '', 'GetUserByIdError');
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * @description Create user forget email process
   * @public
   * @param {UserForgetDto} userForgetDto
   */
  public async createUserForget(userForgetDto: UserForgetDto): Promise<User> {
    try {
      const { email } = userForgetDto;
      const user = await this.findOne({ where: { email, status: true } });
      if (!user) throw new UnauthorizedException();
      return user;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * @description Verify Update Password
   * @public
   * @param {VerifyUpdatePasswordDto} verifyUpdatePasswordDto
   * @param {string} id
   * @returns {Promise<User>}
   */
  public async verifyUpdatePassword(verifyUpdatePasswordDto: VerifyUpdatePasswordDto, id: string): Promise<User> {
    try {
      const user = await this.findOne({ where: { id, status: true } });
      user.salt = await bcrypt.genSalt();
      user.password = await this.hashPassword(verifyUpdatePasswordDto.password, user.salt);
      await user.save();
      return user;
    } catch (error) {
      this.logger.error(error.message, '', 'VerifyUpdatePasswordError');
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * @description User update password
   * @public
   * @param {UserUpdatePassDto} userUpdatePassword
   * @param {string} id
   * @param {Promise<User>}
   */
  public async userUpdatePassword(userUpdatePassword: UserUpdatePassDto, id: string): Promise<User> {
    const { newPassword, oldPassword } = userUpdatePassword;
    const user = await this.findOne({ where: { id, status: true } });
    // if no user throw not acceptable
    if (!user) throw new ForbiddenException('Invalid Password');
    // if password is wrong throw not acceptable
    if (!(await user.validatePassword(oldPassword))) throw new ForbiddenException('Invalid Password');
    // if password is same as previous password throw not acceptable
    if (await user.validatePassword(newPassword)) throw new ForbiddenException('Cannot use previous password');
    user.salt = await bcrypt.genSalt();
    user.password = await this.hashPassword(newPassword, user.salt);
    try {
      await user.save();
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Update password conflict');
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
    return user;
  }

  /**
   * @description Update user subscribe plan and changing user role
   * @deprecated
   * @public
   * @param {UpdateSubscription} updateSubPlan
   * @param {string} id
   * @returns {Promise<IUser.ResponseBase>}
   */
  public async updateSubscribePlan(updateSubPlan: UpdateSubscription, id: string): Promise<IUser.ResponseBase> {
    const user = await this.findOne({ where: { id, status: true } });

    if (!user)
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'User not found',
        },
        HttpStatus.NOT_FOUND,
      );

    user.role = updateSubPlan.role;
    user.expiredDate = utils.addMonths(new Date(Date.now()), updateSubPlan.subRange);

    try {
      await user.save();
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Update subscribe conflict');
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }

    return {
      statusCode: 200,
      status: 'success',
      message: 'Update subscribe success',
    };
  }

  /**
   * @description Update user info
   * @public
   * @param {UpdateUserAdditionalInfoInServerDto} updateUserInfoDto
   * @param {string} id
   * @returns {Promise<User>}
   */
  public async updateUserAdditionalInfo(updateUserInfoDto: UpdateUserAdditionalInfoInServerDto, id: string): Promise<User> {
    const { gender, age, desc, files } = updateUserInfoDto;
    const user = await this.findOne({ where: { id, status: true } });
    if (!user)
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'User not found',
        },
        HttpStatus.NOT_FOUND,
      );
    if (gender) user.gender = gender;
    if (age) user.age = age;
    if (desc) user.desc = desc;
    if (files && files.length > 0) {
      const image_src: string = files.map((file) => `${this.cloudinaryBaseUrl}/users/${file.originalname}`)[0];
      user.profileImage = image_src;
    }
    try {
      await user.save();
    } catch (error) {
      this.logger.log(error.message, 'UpdateUserInfo');
      throw new InternalServerErrorException(error.message);
    }
    return user;
  }

  /**
   * @description Soft delete user
   * @public
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  public async softDeleteUser(id: string): Promise<boolean> {
    try {
      const user = await this.findOne({ where: { id, status: true } });
      if (!user) throw new NotAcceptableException();
      user.status = false;
      await user.save();
      return true;
    } catch (error) {
      this.logger.error(error.message, '', 'SoftDeleteUserError');
      throw new InternalServerErrorException();
    }
  }
}
