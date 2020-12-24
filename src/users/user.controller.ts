import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  Get,
  Request,
  UseGuards,
  HttpStatus,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { UserCreditDto } from './dto';
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

  @Get('/google/redirect')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Request() req: Express.Request): IUser.ResponseBase {
    return this.userService.googleLogin(req.user);
  }

  @Get('/facebook/redirect')
  @UseGuards(AuthGuard('facebook'))
  fbAuthRedirect(@Request() req: Express.Request): IUser.ResponseBase {
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
    @Body(ValidationPipe) userCreditDto: UserCreditDto,
  ): Promise<IUser.SignInResponse> {
    return this.userService.signIn(userCreditDto);
  }
}
