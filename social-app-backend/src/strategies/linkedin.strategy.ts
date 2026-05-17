import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy } from 'passport-linkedin-oauth2';
import { AuthService } from 'src/services/auth.service';

@Injectable()
export class LinkedInStrategy extends PassportStrategy(Strategy, 'linkedin') {
  constructor(
    private readonly authService: AuthService,
  ) {
    super({
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: 'http://social-app.com:8000/auth/linkedin/callback',
      scope: ['r_emailaddress', 'r_liteprofile'],
    });
    
  }

  /**
   * Override userProfile to fetch using LinkedIn v2 APIs
   */
  async userProfile(accessToken: string, done: Function) {
    try {
      const profile = await this.authService.verifyLinkedinToken(accessToken);

      const userProfile = {
        id: profile.providerId,
        firstName: profile.name,
        lastName: profile.name,
        email: profile.email,
        picture: profile.picture,
      };

      done(null, userProfile);
    } catch (err) {
      done(err);
    }
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: Function) {
    const user = {
      provider: 'linkedin',
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      picture: profile.picture,
      accessToken,
    };
    done(null, user);
  }
}
