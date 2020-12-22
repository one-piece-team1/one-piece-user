import { Controller, Get, UsePipes, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UsePipes(ValidationPipe)
  getRequest(): Promise<string> {
    return this.userService.getRequest();
  }
}
