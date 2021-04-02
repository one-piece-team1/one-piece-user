import { Controller, Post, Body, ValidationPipe, Get, Request, UseGuards, HttpStatus, Delete, Param, ParseUUIDPipe, Put, SetMetadata, HttpException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import * as Express from 'express';
import { RoleGuard } from './guards/local-guard';
import { CurrentUser } from './get-user.decorator';
import { User } from './user.entity';
import { SigninCreditDto, UserCreditDto, UserForgetDto, VerifyKeyDto, VerifyUpdatePasswordDto, UserUpdatePassDto, UpdateSubscription, UpdateUserAdditionalInfoInServerDto } from './dto';
import { UserService } from './user.service';
import * as IShare from '../interfaces';
import * as EUser from './enums';
import * as IUser from './interfaces';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('/test')
  @SetMetadata('roles', [EUser.EUserRole.USER])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  adminTest() {
    return 'hello';
  }

  @Get('/info')
  @UseGuards(AuthGuard(['jwt']))
  getUser(@CurrentUser() user: IUser.UserInfo): IUser.ResponseBase {
    return this.userService.getUser(user);
  }

  @Get('/paging')
  @UseGuards(AuthGuard(['jwt']))
  getUsers(@Request() req: Express.Request): Promise<{ users: User[]; take: number; skip: number; count: number } | Error> {
    const searchDto: IUser.ISearch = req.query;
    const isAdmin: boolean = req.user['role'] === EUser.EUserRole.ADMIN;
    return this.userService.getUsers(searchDto, isAdmin);
  }

  @Get('/logout')
  @UseGuards(AuthGuard(['jwt']))
  logOut(@Request() req: Express.Request): Promise<IUser.ResponseBase> {
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

  @Get('/:id/info')
  @UseGuards(AuthGuard(['jwt']))
  getUserById(@CurrentUser() user: IUser.UserInfo, @Param('id', ParseUUIDPipe) id: string): Promise<IUser.ResponseBase> {
    const isAdmin: boolean = user['role'] === EUser.EUserRole.ADMIN;
    return this.userService.getUserById(id, isAdmin);
  }

  @Get('/google/redirect')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@CurrentUser() user: IUser.UserInfo): Promise<IUser.ResponseBase> {
    return this.userService.googleLogin(user);
  }

  @Get('/facebook/redirect')
  @UseGuards(AuthGuard('facebook'))
  fbAuthRedirect(@CurrentUser() user: IUser.UserInfo): Promise<IUser.ResponseBase> {
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

  @Post('/forgets/generates')
  createUserForget(@Body(ValidationPipe) userForgetDto: UserForgetDto): Promise<IUser.ResponseBase> {
    return this.userService.createUserForget(userForgetDto);
  }

  @Post('/forgets/verifies')
  validateVerifyKey(@Body(ValidationPipe) verifyKeyDto: VerifyKeyDto): Promise<IUser.ResponseBase> {
    return this.userService.validateVerifyKey(verifyKeyDto);
  }

  @Post('/forgets/confirms')
  verifyUpdatePassword(@Body(ValidationPipe) verifyUpdatePasswordDto: VerifyUpdatePasswordDto): Promise<IUser.ResponseBase> {
    return this.userService.verifyUpdatePassword(verifyUpdatePasswordDto);
  }

  @Post('/:id/informations/additionals')
  @UseGuards(AuthGuard(['jwt']))
  updateUserAdditionalInfo(@CurrentUser() user: IUser.UserInfo, @Param('id', ParseUUIDPipe) id: string, @Body() updateUserInfoDto: UpdateUserAdditionalInfoInServerDto) {
    return this.userService.updateUserAdditionalInfo(updateUserInfoDto, id, user.id);
  }

  @Put('/:id/password')
  @UseGuards(AuthGuard(['jwt']))
  userUpdatePassword(@CurrentUser() user: IUser.UserInfo, @Param('id', ParseUUIDPipe) id: string, @Body(ValidationPipe) userUpdatePassDto: UserUpdatePassDto): Promise<IUser.ResponseBase> {
    return this.userService.userUpdatePassword(userUpdatePassDto, id, user.id);
  }

  /**
   * @deprecated
   */
  @Put('/:id/subscribes')
  @UseGuards(AuthGuard(['jwt']))
  updateSubscribePlan(@CurrentUser() user: IUser.UserInfo, @Param('id', ParseUUIDPipe) id: string, @Body(ValidationPipe) updateSubPlan: UpdateSubscription): Promise<IUser.ResponseBase> {
    return this.userService.updateSubscribePlan(updateSubPlan, id, user.id);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard(['jwt']))
  softDeleteUser(@CurrentUser() user: IUser.UserInfo, @Param('id', ParseUUIDPipe) id: string): Promise<IUser.ResponseBase> {
    return this.userService.softDeleteUser(id, user.id);
  }
}
