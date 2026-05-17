import { Module } from '@nestjs/common';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { RealtimeService } from 'src/realtime/realtime.service';
import { SocketAuthService } from 'src/services/socket-auth.service';
import { WsJwtMiddleware } from 'src/middlewares/ws-jwt.middleware';
import { RealtimePresenceService } from 'src/services/realtime-presence.service';
import { ChatService } from 'src/services/chat.service';
import { NotificationService } from 'src/services/notification.service';

@Module({
  providers: [
    RealtimeGateway,
    RealtimeService,
    SocketAuthService,
    WsJwtMiddleware,
    RealtimePresenceService,
    ChatService,
    NotificationService
  ],
  exports: [RealtimeService]
})
export class RealtimeModule {}
