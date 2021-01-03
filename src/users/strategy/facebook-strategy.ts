import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-facebook';
import { config } from '../../../config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  private logger: Logger = new Logger('FacebookStrategy');
  constructor(private jwtService: JwtService) {
    super({
      clientID: config.FB.ID,
      clientSecret: config.FB.SECRET,
      callbackURL: config.FB.CALLBACKURL,
      scope: 'email',
      profileFields: ['emails', 'name'],
    });
  }

  /**
   * @description Validate facebook strategy when callback arrives
   * @public
   * @param {string} accessToken
   * @param {string} refreshToken
   * @param {profile} profile
   * @param {VerifyCallback} done
   * @returns {Promise<void>}
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user?: any, info?: any) => void,
  ): Promise<void> {
    const { name, emails } = profile;
    try {
      const jwtAccessToken = await this.jwtService.sign({
        username: `${name.familyName}${name.givenName}`,
        licence: 'facebook',
        email: emails[0].value,
        role: 'user',
      });
      const user = {
        email: emails[0].value,
        username: `${name.familyName}${name.givenName}`,
        accessToken: jwtAccessToken,
      };
      done(null, user, {});
    } catch (error) {
      this.logger.log(error.message, 'Validate-Err');
      throw new UnauthorizedException(error.message);
    }
  }
}
