import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { JwtPayload } from '../interfaces';
import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
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
    const { username } = payload;
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
      throw new UnauthorizedException();
    }
    return user;
  }
}
