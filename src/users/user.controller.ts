import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  Get,
  UseGuards,
} from '@nestjs/common';
import { UserCreditDto } from './dto';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './get-user.decorator';
import { User } from './user.entity';
import * as IUser from './interfaces';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('/infos')
  @UseGuards(AuthGuard())
  test(
    @GetUser() user: User,
  ): { statusCode: string; message: string; user: IUser.UserInfo } {
    const { id, username } = user;
    return {
      statusCode: 'success',
      message: 'auth test',
      user: { id, username },
    };
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
