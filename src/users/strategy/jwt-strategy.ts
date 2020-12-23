import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { JwtPayload } from '../interfaces';
import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from '../user.repository';
import { User } from '../user.entity';
import { config } from '../../../config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(UserRepository)
    private userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.JWT.SECRET,
    });
  }

  /**
   * @description Validate JWT is malform or not and get user information
   * @public
   * @param {JwtPayload} payload
   * @returns {Promise<User | JwtPayload>}
   */
  async validate(payload: JwtPayload): Promise<User | JwtPayload> {
    const { username, licence } = payload;
    if (licence === 'google') {
      return {
        role: payload.role,
        username: payload.username,
        licence: payload.licence,
        email: payload.email,
      };
    }
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
