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
    const { role, username, licence, email } = payload;

    if (licence === 'google') {
      return {
        role,
        username,
        licence,
        email,
      };
    }
    if (licence === 'facebook') {
      return {
        role,
        username,
        licence,
        email,
      };
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
