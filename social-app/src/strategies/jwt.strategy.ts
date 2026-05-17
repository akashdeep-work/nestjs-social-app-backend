import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

import { JwtDecodedPayload } from 'src/auth/schemas/jwt.schema';
import { UserRepository } from 'src/repositories/user.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private userRepository: UserRepository
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtDecodedPayload): Promise<JwtDecodedPayload> {
    const userId = payload._id ?? payload.sub;
    if (!userId) {
      throw new UnauthorizedException();
    }

    const [ user ] = await this.userRepository.findAll({ _id: userId as any });
    if(!user){
      throw new UnauthorizedException();
    }

    return { ...payload, _id: userId };
  }
}
