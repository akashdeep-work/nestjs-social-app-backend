import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Socket } from 'socket.io';
import { SocketAuthService } from 'src/services/socket-auth.service';

@Injectable()
export class WsJwtMiddleware implements NestMiddleware {
  constructor(private readonly socketAuthService: SocketAuthService) {}

  async use(client: Socket, next: (err?: Error) => void) {
    try {
      const user = await this.socketAuthService.authenticate(client);
      (client as Socket & { user: typeof user }).user = user;
      next();
    } catch (_error) {
      next(new UnauthorizedException('Unauthorized websocket connection') as unknown as Error);
    }
  }
}
