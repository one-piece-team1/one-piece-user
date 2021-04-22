import { Controller, Post, Body, ValidationPipe, Get, Request, UseGuards, HttpStatus, Delete, Param, ParseUUIDPipe, Put, SetMetadata, HttpException, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import * as Express from 'express';
import { RoleGuard } from './guards/local-guard';
import { CurrentUser } from './get-user.decorator';
import { User } from './user.entity';
import { SigninCreditDto, UserCreditDto, UserForgetDto, VerifyKeyDto, VerifyUpdatePasswordDto, UserUpdatePassDto, UpdateSubscription, UpdateUserAdditionalInfoInServerDto, UserSearchDto } from './dto';
import { UserService } from './user.service';
import * as IShare from '../interfaces';
import * as EUser from './enums';
import * as IUser from './interfaces';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('/')
  healthCheck() {
    return 'User Service healthy';
  }

  /**
   * @description Get user mem info routes
   * @routes
   * @get
   * @public
   * @param {IUser.UserInfo} user
   * @returns {IShare.IResponseBase<{ user: IUser.JwtPayload }> | HttpException}
   */
  @Get('/info')
  @SetMetadata('roles', [EUser.EUserRole.USER, EUser.EUserRole.VIP1, EUser.EUserRole.VIP2, EUser.EUserRole.ADMIN])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  getUser(@CurrentUser() user: IUser.UserInfo): IShare.IResponseBase<{ user: IUser.JwtPayload }> | HttpException {
    return this.userService.getUser(user);
  }

  /**
   * @description Get users with paging routes
   * @routes
   * @get
   * @public
   * @param {IUser.UserInfo | IUser.JwtPayload} user
   * @param {UserSearchDto} userSearchDto
   * @returns {Promise<IShare.IResponseBase<IShare.IUsersPagingResponseBase<User[]>> | HttpException>}
   */
  @Get('/paging')
  @SetMetadata('roles', [EUser.EUserRole.USER, EUser.EUserRole.VIP1, EUser.EUserRole.VIP2, EUser.EUserRole.ADMIN])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  getUsers(@CurrentUser() user: IUser.UserInfo | IUser.JwtPayload, @Query(ValidationPipe) userSearchDto: UserSearchDto): Promise<IShare.IResponseBase<IShare.IUsersPagingResponseBase<User[]>> | HttpException> {
    return this.userService.getUsers(user, userSearchDto);
  }

  /**
   * @description User logout routes
   * @routes
   * @get
   * @public
   * @param {Express.Request} req
   * @returns {Promise<IShare.IResponseBase<string> | HttpException>}
   */
  @Get('/logout')
  @SetMetadata('roles', [EUser.EUserRole.USER, EUser.EUserRole.VIP1, EUser.EUserRole.VIP2, EUser.EUserRole.ADMIN])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  logOut(@Request() req: Express.Request): Promise<IShare.IResponseBase<string> | HttpException> {
    return this.userService.logOut(req.headers.authorization);
  }

  @Get('/google')
  @UseGuards(AuthGuard('google'))
  googleAuth(): number {
    // didn't do anything due to i don't need to do any action
    return HttpStatus.OK;
  }

  @Get('/facebook')
  @UseGuards(AuthGuard('facebook'))
  fbAuth(): number {
    return HttpStatus.OK;
  }

  /**
   * @description Get specific user info routes
   * @routes
   * @get
   * @public
   * @param {IUser.UserInfo | IUser.JwtPayload} user
   * @param {string} id
   * @returns {Promise<IShare.IResponseBase<{ user: User }> | HttpException>}
   */
  @Get('/:id/info')
  @SetMetadata('roles', [EUser.EUserRole.USER, EUser.EUserRole.VIP1, EUser.EUserRole.VIP2, EUser.EUserRole.ADMIN])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  getUserById(@CurrentUser() user: IUser.UserInfo | IUser.JwtPayload, @Param('id', ParseUUIDPipe) id: string): Promise<IShare.IResponseBase<{ user: User }> | HttpException> {
    return this.userService.getUserById(id, user);
  }

  /**
   * @description Google login callback routes
   * @routes
   * @get
   * @public
   * @param {IUser.UserInfo} user
   * @returns {Promise<IShare.IResponseBase<{ user: IUser.UserInfo }> | HttpException>}
   */
  @Get('/google/redirect')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@CurrentUser() user: IUser.UserInfo): Promise<IShare.IResponseBase<{ user: IUser.UserInfo }> | HttpException> {
    return this.userService.googleLogin(user);
  }

  /**
   * @description facebook login callback routes
   * @routes
   * @get
   * @public
   * @param {IUser.UserInfo} user
   * @returns {Promise<IShare.IResponseBase<{ user: IUser.UserInfo }> | HttpException>}
   */
  @Get('/facebook/redirect')
  @UseGuards(AuthGuard('facebook'))
  fbAuthRedirect(@CurrentUser() user: IUser.UserInfo): Promise<IShare.IResponseBase<{ user: IUser.UserInfo }> | HttpException> {
    return this.userService.fbLogin(user);
  }

  /**
   * @description Create new user routes
   * @routes
   * @post
   * @public
   * @param {UserCreditDto} userCreditDto
   * @returns {Promise<IShare.IResponseBase<string> | HttpException>}
   */
  @Post('/signup')
  signUp(@Body(ValidationPipe) userCreditDto: UserCreditDto): Promise<IShare.IResponseBase<string> | HttpException> {
    return this.userService.signUp(userCreditDto);
  }

  /**
   * @description Signing user routes
   * @routes
   * @post
   * @public
   * @param {SigninCreditDto} signinCreditDto
   * @returns {Promise<IShare.IResponseBase<string> | HttpException>}
   */
  @Post('/signin')
  signIn(@Body(ValidationPipe) signinCreditDto: SigninCreditDto): Promise<IShare.IResponseBase<string> | HttpException> {
    return this.userService.signIn(signinCreditDto);
  }

  /**
   * @description Generates random verify key with mail sending routes
   * @routes
   * @post
   * @public
   * @param {UserForgetDto} userForgetDto
   * @returns {Promise<IShare.IResponseBase<string> | HttpException>}
   */
  @Post('/forgets/generates')
  createUserForget(@Body(ValidationPipe) userForgetDto: UserForgetDto): Promise<IShare.IResponseBase<string> | HttpException> {
    return this.userService.createUserForget(userForgetDto);
  }

  /**
   * @description Verify random key routes
   * @routes
   * @post
   * @public
   * @param {VerifyKeyDto} verifyKeyDto
   * @returns {Promise<IShare.IResponseBase<string> | HttpException>}
   */
  @Post('/forgets/verifies')
  validateVerifyKey(@Body(ValidationPipe) verifyKeyDto: VerifyKeyDto): Promise<IShare.IResponseBase<string> | HttpException> {
    return this.userService.validateVerifyKey(verifyKeyDto);
  }

  /**
   * @description Update password with random key routes
   * @routes
   * @post
   * @public
   * @param {VerifyUpdatePasswordDto} verifyUpdatePasswordDto
   * @returns {Promise<IShare.IResponseBase<string> | HttpException>}
   */
  @Post('/forgets/confirms')
  verifyUpdatePassword(@Body(ValidationPipe) verifyUpdatePasswordDto: VerifyUpdatePasswordDto): Promise<IShare.IResponseBase<string> | HttpException> {
    return this.userService.verifyUpdatePassword(verifyUpdatePasswordDto);
  }

  /**
   * @description Update user info routes
   * @routes
   * @post
   * @public
   * @param {IUser.UserInfo} user
   * @param {string} id
   * @param {UpdateUserAdditionalInfoInServerDto} updateUserInfoDto
   * @returns {Promise<IShare.IResponseBase<User> | HttpException>}
   */
  @Post('/:id/informations/additionals')
  @SetMetadata('roles', [EUser.EUserRole.USER, EUser.EUserRole.VIP1, EUser.EUserRole.VIP2, EUser.EUserRole.ADMIN])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  updateUserAdditionalInfo(@CurrentUser() user: IUser.UserInfo, @Param('id', ParseUUIDPipe) id: string, @Body() updateUserInfoDto: UpdateUserAdditionalInfoInServerDto): Promise<IShare.IResponseBase<User> | HttpException> {
    return this.userService.updateUserAdditionalInfo(updateUserInfoDto, id, user.id);
  }

  /**
   * @description Update user password routes
   * @routes
   * @put
   * @public
   * @param {IUser.UserInfo} user
   * @param {string} id
   * @param {UserUpdatePassDto} userUpdatePassDto
   * @returns {Promise<IShare.IResponseBase<string> | HttpException>}
   */
  @Put('/:id/password')
  @SetMetadata('roles', [EUser.EUserRole.USER, EUser.EUserRole.VIP1, EUser.EUserRole.VIP2, EUser.EUserRole.ADMIN])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  userUpdatePassword(@CurrentUser() user: IUser.UserInfo, @Param('id', ParseUUIDPipe) id: string, @Body(ValidationPipe) userUpdatePassDto: UserUpdatePassDto): Promise<IShare.IResponseBase<string> | HttpException> {
    return this.userService.userUpdatePassword(userUpdatePassDto, id, user.id);
  }

  /**
   * @deprecated
   */
  @Put('/:id/subscribes')
  @SetMetadata('roles', [EUser.EUserRole.USER, EUser.EUserRole.VIP1, EUser.EUserRole.VIP2, EUser.EUserRole.ADMIN])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  updateSubscribePlan(@CurrentUser() user: IUser.UserInfo, @Param('id', ParseUUIDPipe) id: string, @Body(ValidationPipe) updateSubPlan: UpdateSubscription): Promise<IUser.ResponseBase> {
    return this.userService.updateSubscribePlan(updateSubPlan, id, user.id);
  }

  /**
   * @description Soft delete user routes
   * @routes
   * @delete
   * @public
   * @param {IUser.UserInfo} user
   * @param {string} id
   * @returns {Promise<IShare.IResponseBase<unknown> | HttpException>}
   */
  @Delete('/:id')
  @SetMetadata('roles', [EUser.EUserRole.USER, EUser.EUserRole.VIP1, EUser.EUserRole.VIP2, EUser.EUserRole.ADMIN])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  softDeleteUser(@CurrentUser() user: IUser.UserInfo, @Param('id', ParseUUIDPipe) id: string): Promise<IShare.IResponseBase<unknown> | HttpException> {
    return this.userService.softDeleteUser(id, user.id);
  }
}
