import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../repositories/user.repository'; // or use Mongoose if you're using MongoDB
import { OAuthProfileDto, SocialProfileDto } from 'src/dto/oauth.dto';
import { ConfigService } from '@nestjs/config';
import { HttpMethod, LoginProviders, SERVICE } from 'src/helpers/constants';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { CustomLoggerService } from './logging/custom-logger.service';
import { InvalidTokenOrScope, SomethingWentWrongException } from 'src/exceptions/general.error';
import { BaseHttpException } from 'src/exceptions/base-http.exception';
import { IllegalStateError } from 'src/exceptions/illegal-state.error';
import { UserLoginResponse } from 'src/dto/users-responses';

@Injectable()
export class AuthService {
  private readonly logger = new CustomLoggerService(SERVICE, AuthService.name);

  constructor(
    private jwtService: JwtService,
    private userRepository: UserRepository,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  async validateOAuthLogin(profile: OAuthProfileDto) {
    // Check if user exists
    const [ user ] = await this.userRepository.findAll({ email: profile.email });

    // Create user if not exists
    if (!user) {
      await this.userRepository.bulkInsert(
        [
            {
                email: profile.email,
                fullname: `${profile.firstName} ${profile.lastName}`.trim(),
                dob: profile.birthday ?? '',
                gender: profile.gender ?? '',
                picture: profile.picture ?? '',
                provider: profile.provider
            }
        ]
      );
    }

    const [ userUpdated ] = await this.userRepository.findAll({ email: profile.email });

    // Generate JWT
    const payload = { sub: userUpdated._id, email: profile.email };
    const accessToken = this.jwtService.sign(payload);

    await this.userRepository.update({ _id: userUpdated._id, token: accessToken });

    const userInfo = this.userRepository.parseUserInfo(userUpdated);
    const userObj: UserLoginResponse = {
        ...userInfo,
        token: accessToken
      };

    return {
      accessToken,
      user: userObj,
    };
  }

  async validateOAuthLoginMobile(profile: SocialProfileDto) {
    // Check if user exists
    const [ user ] = await this.userRepository.findAll({ email: profile.email });
    let accessToken = '';
    let userObj: UserLoginResponse;
    if (user) {
      // Generate JWT
      const payload = { sub: user._id, email: profile.email };
      accessToken = this.jwtService.sign(payload);

      await this.userRepository.update({ _id: user._id, token: accessToken });

      const userInfo = this.userRepository.parseUserInfo(user);
      userObj = {
        ...userInfo,
        token: accessToken
      };
    }

    return {
      accessToken,
      user: userObj,
    };
  }

  async verifyGoogleToken(idToken: string): Promise<SocialProfileDto> {
    try {
      // Call Google OAuth API to verify token & get profile
      const url = `https://oauth2.googleapis.com/tokeninfo`;
      const response = await this.makeHttpRequest(HttpMethod.GET, url, { id_token: idToken });
      const profile = response.data;

      // Optional: verify the audience (your app's client ID)
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      if (profile.aud !== clientId) {
        throw new InvalidTokenOrScope();
      }

      return {
        provider: LoginProviders.GOOGLE,
        providerId: profile.sub,
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
      };
    } catch (error) {
      const details = `Error while verifying google token: ${error.message || error}`;
      this.logger.error(details);
      if (error instanceof BaseHttpException || error instanceof IllegalStateError) {
        throw error;
      }
      throw new SomethingWentWrongException(details);
    }
  }

  async verifyFacebookToken(accessToken: string): Promise<SocialProfileDto> {
    // Call FB Graph API to verify token & get profile
    const url = `https://graph.facebook.com/me`;
    const response = await this.makeHttpRequest(
      HttpMethod.GET,
      url,
      { fields: 'id,name,email', access_token: accessToken }
    );
    const profile = response.data;
    profile['provider'] = LoginProviders.FACEBOOK;

    return profile;
  }

  async verifyLinkedinToken(accessToken: string): Promise<SocialProfileDto> {
    // Call LinkedIn API
    let url = 'https://api.linkedin.com/v2/me';
    const headers = { Authorization: `Bearer ${accessToken}` };
    const response = await this.makeHttpRequest(HttpMethod.GET, url, {}, headers);
    const profile = response.data;
    profile['provider'] = LoginProviders.LINKEDIN;

    url = 'https://api.linkedin.com/v2/emailAddress';
    const responseEmail = await this.makeHttpRequest(
      HttpMethod.GET,
      url,
      {
        q: 'members',
        projection: '(elements*(handle~))'
      },
      headers
    );
    const emailData = responseEmail.data;

    return {
      provider: LoginProviders.LINKEDIN,
      providerId: profile.id,
      email: emailData?.elements[0]?.['handle~']?.emailAddress ?? '',
      name: `${profile.localizedFirstName} ${profile.localizedLastName}`.trim(),
      picture: profile.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier
    };
  }

  private async makeHttpRequest(httpMethod: HttpMethod, url: string, payload?: object, headers?: object): Promise<AxiosResponse> {
    switch (httpMethod) {
      case HttpMethod.GET:
        return firstValueFrom(this.httpService.get(url, { params: payload, headers }));
      case HttpMethod.POST:
        return firstValueFrom(this.httpService.post(url, payload, { headers }));
      default:
        throw new SomethingWentWrongException(`Unsupported HTTP method: ${httpMethod}`);
    }
  }
}
