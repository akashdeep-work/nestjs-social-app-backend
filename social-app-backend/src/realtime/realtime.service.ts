import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { ChatService } from 'src/services/chat.service';
import { NotificationService } from 'src/services/notification.service';
import { RealtimePresenceService } from 'src/services/realtime-presence.service';
import { AuthenticatedSocket } from 'src/realtime/socket.types';
import {
  CallEventDto,
  ChatMessageEventDto,
  WebRtcAnswerDto,
  WebRtcIceCandidateDto,
  WebRtcOfferDto
} from 'src/realtime/realtime.dto';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly presenceService: RealtimePresenceService,
    private readonly notificationService: NotificationService
  ) {}

  private assertSender(client: AuthenticatedSocket, senderId: string) {
    const authenticatedUserId = String(client.user._id);
    if (authenticatedUserId !== senderId) {
      throw new ForbiddenException('senderId must match authenticated user');
    }
  }

  async handleConnection(server: Server, client: AuthenticatedSocket) {
    const userId = String(client.user?._id);
    if (!userId) {
      client.disconnect(true);
      return;
    }

    client.join(`user:${userId}`);
    const becameOnline = this.presenceService.addSocket(userId, client.id);

    if (becameOnline) {
      server.emit('presence:online', { userId, isOnline: true });
    }
  }

  handleDisconnect(server: Server, client: AuthenticatedSocket) {
    const userId = String(client.user?._id ?? '');
    if (!userId) {
      return;
    }

    const becameOffline = this.presenceService.removeSocket(userId, client.id);
    if (becameOffline) {
      server.emit('presence:offline', { userId, isOnline: false });
    }
  }

  getPresence(userId: string) {
    return this.presenceService.getUserStatus(userId);
  }

  async joinRoom(client: AuthenticatedSocket, roomId: string) {
    await this.chatService.validateRoomAccess(String(client.user._id), `group:${roomId}`);
    client.join(roomId);
    return { ok: true, roomId };
  }

  async leaveRoom(client: AuthenticatedSocket, roomId: string) {
    await this.chatService.validateRoomAccess(String(client.user._id), `group:${roomId}`);
    client.leave(roomId);
    return { ok: true, roomId };
  }

  async sendChatMessage(server: Server, client: AuthenticatedSocket, payload: ChatMessageEventDto) {
    this.assertSender(client, payload.senderId);

    const saved = await this.chatService.sendMessageViaApi(payload.senderId, {
      receiverId: payload.receiverId,
      groupId: payload.roomId ? `group:${payload.roomId}` : undefined,
      type: payload.type,
      content: payload.content
    });

    const realtimeMessage = this.chatService.toRealtimeMessage(saved);
    const eventPayload = {
      id: String(realtimeMessage.id),
      senderId: String(realtimeMessage.senderId),
      receiverId: realtimeMessage.receiverId ? String(realtimeMessage.receiverId) : undefined,
      roomId: realtimeMessage.groupId ? String(realtimeMessage.groupId).replace('group:', '') : undefined,
      type: realtimeMessage.type,
      content: realtimeMessage.content,
      createdAt: realtimeMessage.createdAt,
      readBy: (realtimeMessage.readBy ?? []).map((id: any) => String(id))
    };

    if (payload.roomId) {
      await this.chatService.validateRoomAccess(payload.senderId, `group:${payload.roomId}`);
      server.to(payload.roomId).emit('chat:message', eventPayload);
      return eventPayload;
    }

    if (!payload.receiverId) {
      throw new ForbiddenException('receiverId is required for direct chat');
    }

    for (const socketId of this.presenceService.getSockets(payload.receiverId)) {
      server.to(socketId).emit('chat:message', eventPayload);
    }
    server.to(client.id).emit('chat:message', eventPayload);

    if (!this.presenceService.hasActiveSocket(payload.receiverId)) {
      this.notificationService.dispatchNotification({
        userId: payload.receiverId as any,
        title: 'New chat message',
        body: payload.content,
        data: {
          type: 'chat_message',
          senderId: payload.senderId,
          messageId: eventPayload.id
        }
      }).catch(error => {
        this.logger.error(`Unable to dispatch offline message notification: ${error.message}`);
      });
    }

    return eventPayload;
  }

  async startCall(server: Server, client: AuthenticatedSocket, payload: CallEventDto) {
    this.assertSender(client, payload.senderId);
    const eventPayload = { ...payload, createdAt: new Date().toISOString() };
    await this.emitCallEvent(server, payload, 'call:started', eventPayload);
    return eventPayload;
  }

  async endCall(server: Server, client: AuthenticatedSocket, payload: CallEventDto) {
    this.assertSender(client, payload.senderId);
    const eventPayload = { ...payload, createdAt: new Date().toISOString() };
    await this.emitCallEvent(server, payload, 'call:ended', eventPayload);
    return eventPayload;
  }

  async relayOffer(server: Server, client: AuthenticatedSocket, payload: WebRtcOfferDto) {
    this.assertSender(client, payload.senderId);
    const eventPayload = { ...payload, createdAt: new Date().toISOString() };
    await this.emitCallEvent(server, payload, 'webrtc:offer', eventPayload);
    return eventPayload;
  }

  async relayAnswer(server: Server, client: AuthenticatedSocket, payload: WebRtcAnswerDto) {
    this.assertSender(client, payload.senderId);
    const eventPayload = { ...payload, createdAt: new Date().toISOString() };
    await this.emitCallEvent(server, payload, 'webrtc:answer', eventPayload);
    return eventPayload;
  }

  async relayIceCandidate(server: Server, client: AuthenticatedSocket, payload: WebRtcIceCandidateDto) {
    this.assertSender(client, payload.senderId);
    const eventPayload = { ...payload, createdAt: new Date().toISOString() };
    await this.emitCallEvent(server, payload, 'webrtc:ice-candidate', eventPayload);
    return eventPayload;
  }

  private async emitCallEvent(
    server: Server,
    payload: { senderId: string; targetId?: string; roomId?: string },
    event: string,
    eventPayload: any
  ) {
    if (payload.roomId) {
      await this.chatService.validateRoomAccess(payload.senderId, `group:${payload.roomId}`);
      server.to(payload.roomId).emit(event, eventPayload);
      return;
    }

    if (!payload.targetId) {
      throw new ForbiddenException('targetId is required for direct calls');
    }

    for (const socketId of this.presenceService.getSockets(payload.targetId)) {
      server.to(socketId).emit(event, eventPayload);
    }
  }
}
