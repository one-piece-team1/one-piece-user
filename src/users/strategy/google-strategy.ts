import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PassportStrategy } from '@nestjs/passport';
import { VerifyCallback, Strategy } from 'passport-google-oauth20';
import { config } from '../../../config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private jwtService: JwtService) {
    super({
      clientID: config.GOOGLE.ID,
      clientSecret: config.GOOGLE.SECRET,
      callbackURL: config.GOOGLE.CALLBACKURL,
      scope: ['email', 'profile'],
    });
  }

  /**
   * @description Validate google strategy when callback arrives
   * @public
   * @param {string} accessToken
   * @param {string} refreshToken
   * @param {any} profile
   * @param {VerifyCallback} done
   * @returns {Promise<void>}
   */
  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) {
    const { name, emails, photos } = profile;
    const jwtAccessToken = await this.jwtService.sign({
      username: `${name.familyName}${name.givenName}`,
      licence: 'google',
      email: emails[0].value,
      role: 'user',
    });
    const user = {
      email: emails[0].value,
      username: `${name.familyName}${name.givenName}`,
      picture: photos[0].value,
      accessToken: jwtAccessToken,
    };
    done(null, user);
  }
}
