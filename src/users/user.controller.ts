import { Controller, Delete, Get, Post, Put, UsePipes, ValidationPipe, Request, Param, ParseIntPipe } from '@nestjs/common';
import { UserService } from './user.service';
import * as Express from 'express';
@Controller('/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UsePipes(ValidationPipe)
  getRequest(
    @Request() req: Express.Request,
  ): Promise<string> {
    return this.userService.getRequest();
  }

  @Post()
  @UsePipes(ValidationPipe)
  postRequest(
    @Request() req: Express.Request,
  ): Promise<string> {
    return this.userService.postRequest();
  }

  @Put("/:id")
  @UsePipes(ValidationPipe)
  putRequest(
    @Request() req: Express.Request,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<string> {
    return this.userService.putRequest(id);
  }

  @Delete("/:id")
  @UsePipes(ValidationPipe)
  deleteRequest(
    @Request() req: Express.Request,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<string> {
    return this.userService.delRequest(id);
  }
}
