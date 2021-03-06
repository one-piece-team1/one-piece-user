import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import * as IUser from './interfaces';

export const CurrentUser = createParamDecorator(
  /**
   * @description Get current user decorator
   * @public
   * @param {unknown} data
   * @param {ExecutionContext} ctx
   * @returns {unknown | IUser.UserInfo}
   */
  (data: unknown, ctx: ExecutionContext): unknown | IUser.UserInfo => {
    const user: unknown | IUser.UserInfo = ctx.switchToHttp().getRequest<Request>().user;
    delete user['password'];
    delete user['salt'];
    return user;
  },
);
