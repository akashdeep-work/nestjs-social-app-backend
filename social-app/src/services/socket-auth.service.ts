import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { JwtDecodedPayload } from 'src/auth/schemas/jwt.schema';
import { UserRepository } from 'src/repositories/user.repository';

@Injectable()
export class SocketAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository
  ) {}

  private extractToken(client: Socket): string {
    const authHeader = client.handshake.headers.authorization;
    const fromHeader = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    return client.handshake.auth?.token || fromHeader || client.handshake.query?.token?.toString();
  }

  async authenticate(client: Socket): Promise<JwtDecodedPayload> {
    const token = this.extractToken(client);
    if (!token) {
      throw new UnauthorizedException('Missing socket auth token');
    }

    let payload: JwtDecodedPayload;
    try {
      payload = this.jwtService.verify<JwtDecodedPayload>(token);
    } catch (_error) {
      throw new UnauthorizedException('Invalid socket auth token');
    }
    const userId = payload._id ?? payload.sub;
    if (!userId) {
      throw new UnauthorizedException('Invalid socket auth payload');
    }

    const [user] = await this.userRepository.findAll({ _id: userId as any });
    if (!user) {
      throw new UnauthorizedException('Invalid socket user');
    }

    const normalizedPayload: JwtDecodedPayload = {
      ...payload,
      _id: userId
    };

    client.data.user = normalizedPayload;
    (client as Socket & { user: JwtDecodedPayload }).user = normalizedPayload;
    return normalizedPayload;
  }
}
