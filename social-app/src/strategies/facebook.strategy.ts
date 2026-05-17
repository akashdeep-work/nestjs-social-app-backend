import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy } from 'passport-facebook';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor() {
    super({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: 'http://social-app.com:8000/auth/facebook/callback',
      profileFields: ['emails', 'name', 'photos'],
      scope: ['email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: Function) {
    const { name, emails, photos } = profile;
    const user = {
      provider: 'facebook',
      email: emails?.[0]?.value || null,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos?.[0]?.value,
      accessToken,
    };
    done(null, user);
  }
}
