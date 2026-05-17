import { Injectable } from '@nestjs/common';

@Injectable()
export class RealtimePresenceService {
  private readonly socketsByUser = new Map<string, Set<string>>();

  addSocket(userId: string, socketId: string): boolean {
    const current = this.socketsByUser.get(userId) ?? new Set<string>();
    const wasOffline = current.size === 0;
    current.add(socketId);
    this.socketsByUser.set(userId, current);
    return wasOffline;
  }

  removeSocket(userId: string, socketId: string): boolean {
    const current = this.socketsByUser.get(userId);
    if (!current) {
      return true;
    }

    current.delete(socketId);
    if (current.size === 0) {
      this.socketsByUser.delete(userId);
      return true;
    }

    return false;
  }

  getSockets(userId: string): string[] {
    return [...(this.socketsByUser.get(userId) ?? new Set<string>())];
  }

  hasActiveSocket(userId: string): boolean {
    return this.getSockets(userId).length > 0;
  }

  getUserStatus(userId: string) {
    const sockets = this.getSockets(userId);
    return {
      userId,
      isOnline: sockets.length > 0
    };
  }
}
