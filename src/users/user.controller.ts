import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  Get,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UserCreditDto } from './dto';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';
import * as IUser from './interfaces';
import * as Express from 'express';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('/info')
  @UseGuards(AuthGuard())
  getUser(@Request() req: Express.Request): IUser.ResponseBase {
    return this.userService.getUser(req.user);
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
