import { HttpStatus } from '@nestjs/common';
import * as IShare from '../interfaces';

export default class HTTPResponse {
  /**
   * @description Status ok
   * @public
   * @param {T} message
   * @returns {IShare.IResponseBase<T>}
   */
  StatusOK<T>(message: T): IShare.IResponseBase<T> {
    return Object.freeze({
      status: 'success',
      statusCode: HttpStatus.OK,
      message,
    });
  }

  /**
   * @description Status Created
   * @public
   * @param {T} message
   * @returns {IShare.IResponseBase<T>}
   */
  StatusCreated<T>(message: T): IShare.IResponseBase<T> {
    return Object.freeze({
      status: 'success',
      statusCode: HttpStatus.CREATED,
      message,
    });
  }

  /**
   * @description Status not content
   * @public
   * @returns {IShare.IResponseBase<unknown>}
   */
  StatusNoContent(): IShare.IResponseBase<unknown> {
    return Object.freeze({
      status: 'success',
      statusCode: HttpStatus.NO_CONTENT,
    });
  }

  /**
   * @description Status partial
   * @public
   * @param {T} message
   * @returns {IShare.IResponseBase<T>}
   */
  ParitalContent<T>(message: T): IShare.IResponseBase<T> {
    return Object.freeze({
      status: 'success',
      statusCode: HttpStatus.PARTIAL_CONTENT,
      message,
    });
  }

  /**
   * @description Bad Request Error
   * @public
   * @param {T} message
   * @returns {IShare.IResponseBase<T>}
   */
  BadRequestError<T>(message: T): IShare.IResponseBase<T> {
    return Object.freeze({
      status: 'error',
      statusCode: HttpStatus.BAD_REQUEST,
      message,
    });
  }

  /**
   * @description UnAuthorized Error
   * @public
   * @param {T} message
   * @returns {IShare.IResponseBase<T>}
   */
  UnAuthorizedError<T>(message: T): IShare.IResponseBase<T> {
    return Object.freeze({
      status: 'error',
      statusCode: HttpStatus.UNAUTHORIZED,
      message,
    });
  }

  /**
   * @description Forbidden Error
   * @public
   * @param {T} message
   * @returns {IShare.IResponseBase<T>}
   */
  ForbiddenError<T>(message: T): IShare.IResponseBase<T> {
    return Object.freeze({
      status: 'error',
      statusCode: HttpStatus.FORBIDDEN,
      message,
    });
  }

  /**
   * @description Not Found Error
   * @public
   * @param {any} message
   * @returns {ResponseStatus}
   */
  NotFoundError<T>(message: T): IShare.IResponseBase<T> {
    return Object.freeze({
      status: 'error',
      statusCode: HttpStatus.NOT_FOUND,
      message,
    });
  }

  /**
   * @description Conflict Error
   * @public
   * @param {any} message
   * @returns {ResponseStatus}
   */
  ConflictError<T>(message: T): IShare.IResponseBase<T> {
    return Object.freeze({
      status: 'error',
      statusCode: HttpStatus.CONFLICT,
      message,
    });
  }

  /**
   * @description Interal Server Error
   * @public
   * @param {any} message
   * @returns {ResponseStatus}
   */
  InternalServerError<T>(message: T): IShare.IResponseBase<T> {
    return Object.freeze({
      status: 'error',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message,
    });
  }
}
