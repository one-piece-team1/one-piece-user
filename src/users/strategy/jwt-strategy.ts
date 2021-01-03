import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { JwtPayload } from '../interfaces';
import {
  Injectable,
  Inject,
  UnauthorizedException,
  NotAcceptableException,
} from '@nestjs/common';
import Redis from 'ioredis';
import { Request } from 'express';
import { UserRepository } from '../user.repository';
import { User } from '../user.entity';
import { config } from '../../../config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private redisClient = new Redis(config.REDIS_URL);

  constructor(
    @Inject(UserRepository)
    private userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      passReqToCallback: true,
      secretOrKey: config.JWT.SECRET,
    });
  }

  /**
   * @description Validate JWT is malform or not and get user information
   * @public
   * @param {Request} req
   * @param {JwtPayload} payload
   * @returns {Promise<User | JwtPayload>}
   */
  async validate(
    req: Request,
    payload: JwtPayload,
  ): Promise<User | JwtPayload> {
    // check token expired time
    const jwtExp = payload.exp * 1000;
    if (Date.now() >= jwtExp)
      throw new UnauthorizedException('Token is expired');

    const { username } = payload;

    // check blacklists
    const blacklists: string[] = await this.redisClient.lrange(
      'blacklist',
      0,
      99999999,
    );
    if (blacklists.indexOf(req.headers.authorization) >= 0) {
      throw new UnauthorizedException();
    }

    const user = await this.userRepository.findOne({
      where: { username, status: true },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // if user has expired their credit throw error
    if (Date.now() >= new Date(user.expiredDate).getTime()) {
      throw new NotAcceptableException('User credit has expired');
    }

    return user;
  }
}
