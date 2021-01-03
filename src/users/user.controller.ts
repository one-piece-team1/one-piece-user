import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  Get,
  Request,
  UseGuards,
  HttpStatus,
  Delete,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import {
  SigninCreditDto,
  UserCreditDto,
  UserForgetDto,
  VerifyKeyDto,
  VerifyUpdatePasswordDto,
  UserUpdatePassDto,
} from './dto';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';
import * as IUser from './interfaces';
import * as Express from 'express';
import { User } from './user.entity';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('/info')
  @UseGuards(AuthGuard(['jwt']))
  getUser(@Request() req: Express.Request): IUser.ResponseBase {
    return this.userService.getUser(req.user);
  }

  @Get('/paging')
  @UseGuards(AuthGuard(['jwt']))
  getUsers(
    @Request() req: Express.Request,
  ): Promise<{ users: User[]; count: number } | Error> {
    const searchDto: IUser.ISearch = req.query;
    return this.userService.getUsers(searchDto);
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
  fbAuth(@Request() req: Express.Request): number {
    return HttpStatus.OK;
  }

  @Get('/:id/info')
  @UseGuards(AuthGuard(['jwt']))
  getUserById(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    return this.userService.getUserById(id);
  }

  @Get('/google/redirect')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(
    @Request() req: Express.Request,
  ): Promise<IUser.ResponseBase> {
    return this.userService.googleLogin(req.user);
  }

  @Get('/facebook/redirect')
  @UseGuards(AuthGuard('facebook'))
  fbAuthRedirect(@Request() req: Express.Request): Promise<IUser.ResponseBase> {
    return this.userService.fbLogin(req.user);
  }

  @Post('/signup')
  signUp(
    @Body(ValidationPipe) userCreditDto: UserCreditDto,
  ): Promise<IUser.ResponseBase> {
    return this.userService.signUp(userCreditDto);
  }

  @Post('/signin')
  signIn(
    @Body(ValidationPipe) signinCreditDto: SigninCreditDto,
  ): Promise<IUser.SignInResponse> {
    return this.userService.signIn(signinCreditDto);
  }

  @Post('/forgets/generates')
  createUserForget(
    @Body(ValidationPipe) userForgetDto: UserForgetDto,
  ): Promise<IUser.ResponseBase> {
    return this.userService.createUserForget(userForgetDto);
  }

  @Post('/forgets/verifies')
  validateVerifyKey(
    @Body(ValidationPipe) verifyKeyDto: VerifyKeyDto,
  ): Promise<IUser.ResponseBase> {
    return this.userService.validateVerifyKey(verifyKeyDto);
  }

  @Post('/forgets/confirms')
  verifyUpdatePassword(
    @Body(ValidationPipe) verifyUpdatePasswordDto: VerifyUpdatePasswordDto,
  ): Promise<IUser.ResponseBase> {
    return this.userService.verifyUpdatePassword(verifyUpdatePasswordDto);
  }

  @Put('/:id/password')
  @UseGuards(AuthGuard(['jwt']))
  userUpdatePassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) userUpdatePassDto: UserUpdatePassDto,
  ): Promise<IUser.ResponseBase> {
    return this.userService.userUpdatePassword(userUpdatePassDto, id);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard(['jwt']))
  softDeleteUser(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<IUser.ResponseBase> {
    return this.userService.softDeleteUser(id);
  }
}
