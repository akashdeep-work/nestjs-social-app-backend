import { HttpException, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsJwtMiddleware } from 'src/middlewares/ws-jwt.middleware';
import { AuthenticatedSocket } from 'src/realtime/socket.types';
import { WsExceptionFilter } from 'src/exceptions/ws-exception.filter';
import {
  CallEventDto,
  ChatMessageEventDto,
  PresenceRequestDto,
  RoomMembershipDto,
  WebRtcAnswerDto,
  WebRtcIceCandidateDto,
  WebRtcOfferDto
} from 'src/realtime/realtime.dto';
import { RealtimeService } from 'src/realtime/realtime.service';

@UseFilters(WsExceptionFilter)
@WebSocketGateway({ cors: true, namespace: '/realtime' })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly realtimeService: RealtimeService,
    private readonly wsJwtMiddleware: WsJwtMiddleware
  ) {}

  afterInit(server: Server) {
    server.use((socket: Socket, next) => this.wsJwtMiddleware.use(socket, next));
  }

  async handleConnection(client: AuthenticatedSocket) {
    if (!client.user) {
      client.disconnect(true);
      return;
    }

    await this.realtimeService.handleConnection(this.server, client);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.realtimeService.handleDisconnect(this.server, client);
  }

  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @SubscribeMessage('room:join')
  async joinRoom(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() payload: RoomMembershipDto) {
    return this.executeSafely(() => this.realtimeService.joinRoom(client, payload.roomId));
  }

  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @SubscribeMessage('room:leave')
  async leaveRoom(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() payload: RoomMembershipDto) {
    return this.executeSafely(() => this.realtimeService.leaveRoom(client, payload.roomId));
  }

  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @SubscribeMessage('presence:get')
  async getUserPresence(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() payload: PresenceRequestDto) {
    const status = this.realtimeService.getPresence(payload.userId);
    client.emit('presence:update', status);
    return status;
  }

  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @SubscribeMessage('chat:send')
  async sendChatMessage(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() payload: ChatMessageEventDto) {
    return this.executeSafely(() => this.realtimeService.sendChatMessage(this.server, client, payload));
  }

  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @SubscribeMessage('call:start')
  async startCall(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() payload: CallEventDto) {
    return this.executeSafely(() => this.realtimeService.startCall(this.server, client, payload));
  }

  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @SubscribeMessage('call:end')
  async endCall(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() payload: CallEventDto) {
    return this.executeSafely(() => this.realtimeService.endCall(this.server, client, payload));
  }

  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @SubscribeMessage('webrtc:offer')
  async relayOffer(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() payload: WebRtcOfferDto) {
    return this.executeSafely(() => this.realtimeService.relayOffer(this.server, client, payload));
  }

  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @SubscribeMessage('webrtc:answer')
  async relayAnswer(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() payload: WebRtcAnswerDto) {
    return this.executeSafely(() => this.realtimeService.relayAnswer(this.server, client, payload));
  }

  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @SubscribeMessage('webrtc:ice-candidate')
  async relayIceCandidate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: WebRtcIceCandidateDto
  ) {
    return this.executeSafely(() => this.realtimeService.relayIceCandidate(this.server, client, payload));
  }

  private async executeSafely<T>(operation: () => Promise<T>) {
    try {
      return await operation();
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  private toWsException(error: unknown): WsException {
    if (error instanceof WsException) {
      return error;
    }

    if (error instanceof HttpException) {
      const response = error.getResponse();
      const message = typeof response === 'object' && response !== null ? (response as any).message : response;
      const normalizedMessage = Array.isArray(message) ? message.join(', ') : message;
      return new WsException(normalizedMessage || error.message);
    }

    if (error instanceof Error) {
      return new WsException(error.message);
    }

    return new WsException('Unexpected websocket error');
  }
}
