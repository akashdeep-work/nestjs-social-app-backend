
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatMessageDto } from '../dto/chat-message.dto';
import { ChatMessage, ChatMessageDocument, ChatMessageType } from 'src/schemas/chat-message.schema';
import { ChatGroup, ChatGroupDocument } from 'src/schemas/chat-group.schema';
import { ChatUserSettings, ChatUserSettingsDocument } from 'src/schemas/chat-user-settings.schema';
import { User, UserDocument } from 'src/schemas/user.schema';
import { CreateGroupDto, SendMessageApiDto, UpdateGroupDto } from '../dto/chat-api.dto';

const SHARED_MEDIA_MESSAGE_TYPES = [
  ChatMessageType.IMAGE,
  ChatMessageType.VIDEO,
  ChatMessageType.AUDIO,
  ChatMessageType.DOCUMENT
] as const;

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatMessage.name)

    private readonly chatMessageModel: Model<ChatMessageDocument>,
    @InjectModel(ChatGroup.name)
    private readonly chatGroupModel: Model<ChatGroupDocument>,
    @InjectModel(ChatUserSettings.name)
    private readonly chatUserSettingsModel: Model<ChatUserSettingsDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>

  ) {}


  toRealtimeMessage(saved: ChatMessageDocument) {
    return {
      id: saved._id,
      senderId: saved.senderId,
      receiverId: saved.receiverId,
      groupId: saved.groupId,
      type: saved.type,
      content: saved.content,
      createdAt: saved.createdAt,
      readBy: saved.readBy ?? []
    };
  }

  async saveCallRecord(currentUserId: string, payload: { roomId?: string; targetUserId?: string; callType?: string; callId: string }) {
    if (payload.roomId?.startsWith('group:')) {
      return this.sendMessageViaApi(currentUserId, {
        groupId: payload.roomId,
        type: ChatMessageType.CALL,
        content: `Call started (${payload.callType ?? 'audio'})`
      });
    }

    if (payload.targetUserId) {
      return this.sendMessageViaApi(currentUserId, {
        receiverId: payload.targetUserId,
        type: ChatMessageType.CALL,
        content: `Call started (${payload.callType ?? 'audio'})`
      });
    }

    if (payload.roomId?.startsWith('direct:')) {
      const participants = this.parseDirectRoomParticipants(payload.roomId);
      const receiverId = participants.find(id => id !== currentUserId);
      if (receiverId) {
        return this.sendMessageViaApi(currentUserId, {
          receiverId,
          type: ChatMessageType.CALL,
          content: `Call started (${payload.callType ?? 'audio'})`
        });
      }
    }

    return null;
  }

  async saveMessage(payload: ChatMessageDto): Promise<ChatMessageDocument> {
    const document = new this.chatMessageModel({
      senderId: new Types.ObjectId(payload.senderId),
      receiverId: payload.receiverId ? new Types.ObjectId(payload.receiverId) : undefined,
      groupId: payload.groupId,
      type: payload.type,
      content: payload.content,
      readBy: [new Types.ObjectId(payload.senderId)],
      createdAt: new Date()
    });

    return await document.save();
  }

  buildDirectRoom(senderId: string, receiverId: string): string {
    return `direct:${[senderId, receiverId].sort().join(':')}`;
  }


  private getDirectChatKey(userAId: string, userBId: string): string {
    return [userAId, userBId].sort().join(':');
  }

  private parseDirectRoomParticipants(roomId: string): string[] {
    if (!roomId.startsWith('direct:')) {
      throw new BadRequestException('Invalid direct room id');
    }

    const participants = roomId.replace('direct:', '').split(':').filter(Boolean);
    if (participants.length !== 2) {
      throw new BadRequestException('Invalid direct room participants');
    }

    return participants;
  }

  private async getOrCreateSettings(currentUserId: string): Promise<ChatUserSettingsDocument> {
    let settings = await this.chatUserSettingsModel.findOne({ userId: new Types.ObjectId(currentUserId) });
    if (!settings) {
      settings = await this.chatUserSettingsModel.create({
        userId: new Types.ObjectId(currentUserId),
        blockedUsers: [],
        blockedGroups: [],
        deletedDirectChats: [],
        clearedChats: {},
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return settings;
  }



  private async validateDirectTarget(currentUserId: string, targetUserId: string) {
    if (targetUserId === currentUserId) {
      throw new BadRequestException('You cannot start a direct message with yourself');
    }

    const targetUser = await this.userModel
      .findById(targetUserId, { fullname: 1, username: 1, picture: 1 })
      .lean<any>();

    if (!targetUser) {
      throw new NotFoundException('Receiver not found');
    }

    const settings = await this.getOrCreateSettings(currentUserId);
    const blockedUsers = (settings.blockedUsers ?? []).map(item => item.toString());
    if (blockedUsers.includes(targetUserId)) {
      throw new ForbiddenException('You have blocked this user');
    }

    return { targetUser, settings };
  }

  private getChatClearedAt(settings: ChatUserSettingsDocument, chatId: string): Date | null {
    const raw = (settings as any)?.clearedChats?.[chatId] ?? (settings as any)?.clearedChats?.get?.(chatId);
    if (!raw) {
      return null;
    }

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private ensureGroupHasAdmin(group: ChatGroupDocument) {

    if (group.admins.length > 0 || group.members.length === 0) {
      return;
    }

    group.admins = [group.members[0]];
  }

  async sendMessageViaApi(currentUserId: string, payload: SendMessageApiDto) {
    if (payload.groupId) {
      const groupId = payload.groupId.replace('group:', '');
      const group = await this.chatGroupModel.findById(groupId);
      if (!group || group.deletedAt) {
        throw new NotFoundException('Chat group not found');
      }

      const isMember = group.members.some(member => member.toString() === currentUserId);
      if (!isMember) {
        throw new ForbiddenException('You are not a member of this group');
      }

      return await this.saveMessage({
        senderId: currentUserId,
        groupId: `group:${groupId}`,
        type: payload.type,
        content: payload.content
      });
    }

    if (!payload.receiverId) {
      throw new BadRequestException('receiverId is required for direct messages');
    }

    const { settings } = await this.validateDirectTarget(currentUserId, payload.receiverId);
    const chatKey = this.getDirectChatKey(currentUserId, payload.receiverId);
    if ((settings.deletedDirectChats ?? []).includes(chatKey)) {
      settings.deletedDirectChats = (settings.deletedDirectChats ?? []).filter(key => key !== chatKey);
      settings.updatedAt = new Date();
      await settings.save();
    }

    return await this.saveMessage({
      senderId: currentUserId,
      receiverId: payload.receiverId,
      type: payload.type,
      content: payload.content
    });
  }

  async validateRoomAccess(currentUserId: string, roomId: string) {
    if (roomId.startsWith('user:')) {
      const roomUserId = roomId.replace('user:', '');
      if (roomUserId !== currentUserId) {
        throw new ForbiddenException('You can only join your own user room');
      }
      return { ok: true, type: 'user' };
    }

    if (roomId.startsWith('direct:')) {
      const participants = this.parseDirectRoomParticipants(roomId);
      if (!participants.includes(currentUserId)) {
        throw new ForbiddenException('You are not part of this direct chat room');
      }

      const otherUserId = participants.find(id => id !== currentUserId);
      if (!otherUserId) {
        throw new BadRequestException('Invalid direct room id');
      }

      await this.validateDirectTarget(currentUserId, otherUserId);
      return { ok: true, type: 'direct', otherUserId };
    }

    if (roomId.startsWith('group:')) {
      const groupId = roomId.replace('group:', '');
      const group = await this.chatGroupModel.findById(groupId).lean<any>();
      if (!group || group.deletedAt) {
        throw new NotFoundException('Chat group not found');
      }

      const isMember = (group.members ?? []).some((member: any) => member.toString() === currentUserId);
      if (!isMember) {
        throw new ForbiddenException('You are not a member of this group');
      }

      return { ok: true, type: 'group', groupId: roomId };
    }

    throw new BadRequestException('Invalid room id');
  }

  async getGroupMemberIds(roomId: string): Promise<string[]> {
    if (!roomId.startsWith('group:')) {
      throw new BadRequestException('Invalid group room id');
    }

    const groupId = roomId.replace('group:', '');
    const group = await this.chatGroupModel.findById(groupId).select({ members: 1, deletedAt: 1 }).lean<any>();
    if (!group || group.deletedAt) {
      throw new NotFoundException('Chat group not found');
    }

    return (group.members ?? []).map((member: any) => member.toString());
  }

  async getChatList(currentUserId: string) {
    const settings = await this.getOrCreateSettings(currentUserId);
    const blockedUsers = (settings.blockedUsers ?? []).map(item => item.toString());
    const deletedDirectChats = settings.deletedDirectChats ?? [];

    const directMessages = await this.chatMessageModel
      .find({
        groupId: { $exists: false },
        $or: [
          { senderId: new Types.ObjectId(currentUserId) },
          { receiverId: new Types.ObjectId(currentUserId) }
        ]
      })
      .sort({ createdAt: -1 })
      .lean();

    const directMap = new Map<string, any>();
    for (const message of directMessages) {
      const senderId = message.senderId?.toString();
      const receiverId = message.receiverId?.toString();
      const otherUserId = senderId === currentUserId ? receiverId : senderId;
      if (!otherUserId) {
        continue;
      }

      const chatKey = this.getDirectChatKey(currentUserId, otherUserId);
      const chatId = `direct:${otherUserId}`;
      const clearedAt = this.getChatClearedAt(settings, chatId);
      if (blockedUsers.includes(otherUserId) || deletedDirectChats.includes(chatKey) || directMap.has(chatKey)) {
        continue;
      }

      if (clearedAt && new Date(message.createdAt).getTime() <= clearedAt.getTime()) {
        continue;
      }

      directMap.set(chatKey, {
        chatId,
        type: 'individual',
        isGroup: false,
        lastMessage: message,
        updatedAt: message.createdAt,
        userId: otherUserId
      });
    }

    const userIds = [...new Set([...directMap.values()].map(item => item.userId))].map(id => new Types.ObjectId(id));
    const users = await this.userModel.find({ _id: { $in: userIds } }, { fullname: 1, picture: 1 }).lean<any[]>();
    const userMap = new Map<string, any>(users.map(item => [item._id.toString(), item]));

    const directChatRows = [...directMap.values()];
    const directUnreadCounts = await Promise.all(
      directChatRows.map(item =>
        this.chatMessageModel.countDocuments(
          this.buildUnreadFilter(currentUserId, item.chatId, this.getChatClearedAt(settings, item.chatId))
        )
      )
    );

    const directChats = directChatRows.map((item, index) => ({
      chatId: item.chatId,
      type: item.type,
      isGroup: item.isGroup,
      name: userMap.get(item.userId)?.fullname,
      image: userMap.get(item.userId)?.picture,
      lastMessage: item.lastMessage,
      unreadCount: directUnreadCounts[index] ?? 0,
      updatedAt: item.updatedAt
    }));

    const groups = await this.chatGroupModel
      .find({
        members: new Types.ObjectId(currentUserId),
        deletedAt: { $exists: false },
        _id: { $nin: settings.blockedGroups ?? [] }
      })
      .sort({ updatedAt: -1 })
      .lean();

    const groupIds = groups.map(group => `group:${group._id.toString()}`);
    const groupLastMessages = await this.chatMessageModel.aggregate([
      { $match: { groupId: { $in: groupIds } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$groupId', message: { $first: '$$ROOT' } } }
    ]);
    const groupLastMessageMap = new Map(groupLastMessages.map(item => [item._id, item.message]));

    const groupUnreadCounts = await Promise.all(
      groups.map(group => {
        const chatId = `group:${group._id.toString()}`;
        return this.chatMessageModel.countDocuments(
          this.buildUnreadFilter(currentUserId, chatId, this.getChatClearedAt(settings, chatId))
        );
      })
    );

    const groupChats = groups
      .map((group, index) => {
        const chatId = `group:${group._id.toString()}`;
        const clearedAt = this.getChatClearedAt(settings, chatId);
        const lastMessage = groupLastMessageMap.get(chatId) ?? null;
        const shouldHide = clearedAt && (!lastMessage || new Date(lastMessage.createdAt).getTime() <= clearedAt.getTime());

        if (shouldHide) {
          return null;
        }

        return {
          chatId,
          type: 'group',
          isGroup: true,
          name: group.name,
          image: group.image,
          lastMessage,
          unreadCount: groupUnreadCounts[index] ?? 0,
          updatedAt: group.updatedAt ?? group.createdAt
        };
      })
      .filter(Boolean);

    return [...directChats, ...groupChats].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }



  private buildUnreadFilter(currentUserId: string, chatId: string, clearedAt?: Date | null): any {
    const readByFilter = { $ne: new Types.ObjectId(currentUserId) };

    if (chatId.startsWith('direct:')) {
      const otherUserId = chatId.replace('direct:', '');
      const filter: any = {
        groupId: { $exists: false },
        senderId: new Types.ObjectId(otherUserId),
        receiverId: new Types.ObjectId(currentUserId),
        readBy: readByFilter
      };

      if (clearedAt) {
        filter.createdAt = { $gt: clearedAt };
      }

      return filter;
    }

    if (chatId.startsWith('group:')) {
      const filter: any = {
        groupId: chatId,
        senderId: { $ne: new Types.ObjectId(currentUserId) },
        readBy: readByFilter
      };

      if (clearedAt) {
        filter.createdAt = { $gt: clearedAt };
      }

      return filter;
    }

    throw new BadRequestException('Invalid chat id');
  }

  async markChatAsRead(currentUserId: string, chatId: string) {
    if (chatId.startsWith('direct:')) {
      const otherUserId = chatId.replace('direct:', '');
      await this.validateDirectTarget(currentUserId, otherUserId);
    } else if (chatId.startsWith('group:')) {
      const groupId = chatId.replace('group:', '');
      const group = await this.chatGroupModel.findById(groupId).lean<any>();
      if (!group || group.deletedAt) {
        throw new NotFoundException('Chat group not found');
      }

      const isMember = (group.members ?? []).some((member: any) => member.toString() === currentUserId);
      if (!isMember) {
        throw new ForbiddenException('You are not a member of this group');
      }
    } else {
      throw new BadRequestException('Invalid chat id');
    }

    const filter = this.buildUnreadFilter(currentUserId, chatId);
    const result = await this.chatMessageModel.updateMany(filter, {
      $addToSet: { readBy: new Types.ObjectId(currentUserId) }
    });

    return { ok: true, chatId, updatedCount: result.modifiedCount ?? 0 };
  }

  async getTotalUnreadCount(currentUserId: string): Promise<number> {
    const chats = await this.getChatList(currentUserId);
    return chats.reduce((sum, chat) => sum + Number(chat?.unreadCount ?? 0), 0);
  }

  async searchChats(currentUserId: string, query: string) {
    const q = query?.trim();
    if (!q) {
      throw new BadRequestException('query is required');
    }

    const list = await this.getChatList(currentUserId);
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const directRows = list.filter(item => item.chatId.startsWith('direct:'));
    const directUserIds = directRows.map(item => item.chatId.replace('direct:', ''));
    const users = directUserIds.length
      ? await this.userModel
          .find({ _id: { $in: directUserIds.map(id => new Types.ObjectId(id)) } }, { fullname: 1, username: 1, email: 1 })
          .lean<any[]>()
      : [];
    const userMap = new Map(users.map(item => [item._id.toString(), item]));

    const directChats = directRows.filter(item => {
      const user = userMap.get(item.chatId.replace('direct:', ''));
      return regex.test(user?.fullname ?? '') || regex.test(user?.username ?? '') || regex.test(user?.email ?? '');
    });

    const groupChats = list.filter(item => item.chatId.startsWith('group:') && regex.test(item.name ?? ''));

    return [...directChats, ...groupChats].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getDirectChatMessagesByUserId(currentUserId: string, otherUserId: string, limit = 20, before?: string) {
    await this.validateDirectTarget(currentUserId, otherUserId);
    const chatId = `direct:${otherUserId}`;
    return this.getChatMessages(currentUserId, chatId, limit, before);
  }

  async getChatMediaFiles(
    currentUserId: string,
    chatId: string,
    limit = 20,
    before?: string,
    type?: ChatMessageType
  ) {
    if (type && !SHARED_MEDIA_MESSAGE_TYPES.includes(type as any)) {
      throw new BadRequestException('type must be one of: image, video, audio, document');
    }

    const query: any = {
      type: type ?? { $in: SHARED_MEDIA_MESSAGE_TYPES }
    };
    const safeLimit = Math.max(1, Math.min(Number(limit || 20), 100));

    if (before) {
      query._id = { $lt: new Types.ObjectId(before) };
    }

    if (chatId.startsWith('direct:')) {
      const otherUserId = chatId.replace('direct:', '');
      await this.validateDirectTarget(currentUserId, otherUserId);
      const settings = await this.getOrCreateSettings(currentUserId);
      const chatKey = this.getDirectChatKey(currentUserId, otherUserId);
      if ((settings.deletedDirectChats ?? []).includes(chatKey)) {
        return { items: [], pagination: { limit: safeLimit, nextBefore: null, hasMore: false } };
      }

      const clearedAt = this.getChatClearedAt(settings, chatId);
      if (clearedAt) {
        query.createdAt = { $gt: clearedAt };
      }

      query.groupId = { $exists: false };
      query.$or = [
        { senderId: new Types.ObjectId(currentUserId), receiverId: new Types.ObjectId(otherUserId) },
        { senderId: new Types.ObjectId(otherUserId), receiverId: new Types.ObjectId(currentUserId) }
      ];
    } else if (chatId.startsWith('group:')) {
      const groupId = chatId.replace('group:', '');
      const group = await this.chatGroupModel.findById(groupId).lean<any>();
      if (!group || group.deletedAt) {
        throw new NotFoundException('Chat group not found');
      }

      const isMember = (group.members ?? []).some((member: any) => member.toString() === currentUserId);
      if (!isMember) {
        throw new ForbiddenException('You are not a member of this group');
      }

      const settings = await this.getOrCreateSettings(currentUserId);
      const clearedAt = this.getChatClearedAt(settings, chatId);
      if (clearedAt) {
        query.createdAt = { $gt: clearedAt };
      }

      query.groupId = chatId;
    } else {
      throw new BadRequestException('Invalid chat id');
    }

    const items = await this.chatMessageModel
      .find(query, { senderId: 1, receiverId: 1, groupId: 1, type: 1, content: 1, createdAt: 1 })
      .sort({ _id: -1 })
      .limit(safeLimit + 1)
      .lean<any[]>();

    const hasMore = items.length > safeLimit;
    const pagedItems = hasMore ? items.slice(0, safeLimit) : items;

    return {
      items: pagedItems,
      pagination: {
        limit: safeLimit,
        hasMore,
        nextBefore: hasMore ? pagedItems[pagedItems.length - 1]?._id?.toString?.() ?? null : null
      }
    };
  }

  async getChatMessages(currentUserId: string, chatId: string, limit = 20, before?: string) {
    const query: any = {};
    const safeLimit = Math.max(1, Number(limit || 20));

    if (before) {
      query._id = { $lt: new Types.ObjectId(before) };
    }

    if (chatId.startsWith('direct:')) {
      const otherUserId = chatId.replace('direct:', '');
      const settings = await this.getOrCreateSettings(currentUserId);
      const chatKey = this.getDirectChatKey(currentUserId, otherUserId);
      if ((settings.deletedDirectChats ?? []).includes(chatKey)) {
        return [];
      }

      const clearedAt = this.getChatClearedAt(settings, chatId);
      if (clearedAt) {
        query.createdAt = { $gt: clearedAt };
      }

      query.groupId = { $exists: false };
      query.$or = [
        { senderId: new Types.ObjectId(currentUserId), receiverId: new Types.ObjectId(otherUserId) },
        { senderId: new Types.ObjectId(otherUserId), receiverId: new Types.ObjectId(currentUserId) }
      ];
    } else if (chatId.startsWith('group:')) {
      const groupId = chatId.replace('group:', '');
      const group = await this.chatGroupModel.findById(groupId).lean();
      if (!group || group.deletedAt) {
        throw new NotFoundException('Chat group not found');
      }

      const exists = group.members.some(member => member.toString() === currentUserId);
      if (!exists) {
        throw new ForbiddenException('You are not a member of this group');
      }

      const settings = await this.getOrCreateSettings(currentUserId);
      const clearedAt = this.getChatClearedAt(settings, chatId);
      if (clearedAt) {
        query.createdAt = { $gt: clearedAt };
      }

      query.groupId = chatId;
    } else {
      throw new BadRequestException('Invalid chat id');
    }

    return await this.chatMessageModel.find(query).sort({ _id: -1 }).limit(safeLimit).lean();
  }

  async getChatDetails(currentUserId: string, chatId: string) {
    if (chatId.startsWith('direct:')) {
      const otherUserId = chatId.replace('direct:', '');
      const otherUser = await this.userModel.findById(otherUserId, { fullname: 1, picture: 1 }).lean();
      if (!otherUser) {
        throw new NotFoundException('User not found');
      }

      const mediaFiles = await this.chatMessageModel.find({
        groupId: { $exists: false },
        type: { $in: SHARED_MEDIA_MESSAGE_TYPES },
        $or: [
          { senderId: new Types.ObjectId(currentUserId), receiverId: new Types.ObjectId(otherUserId) },
          { senderId: new Types.ObjectId(otherUserId), receiverId: new Types.ObjectId(currentUserId) }
        ]
      }, { type: 1, content: 1, createdAt: 1 }).sort({ createdAt: -1 }).lean();

      return {
        chatId,
        type: 'individual',
        name: otherUser.fullname,
        image: otherUser.picture,
        mediaFiles,
        members: [currentUserId, otherUserId]
      };
    }

    if (chatId.startsWith('group:')) {
      const groupId = chatId.replace('group:', '');
      const group = await this.chatGroupModel.findById(groupId).lean();
      if (!group || group.deletedAt) {
        throw new NotFoundException('Chat group not found');
      }

      const memberIds = group.members.map(member => member.toString());
      if (!memberIds.includes(currentUserId)) {
        throw new ForbiddenException('You are not a member of this group');
      }

      const members = await this.userModel.find({ _id: { $in: group.members } }, { fullname: 1, picture: 1 }).lean();
      const mediaFiles = await this.chatMessageModel.find({
        groupId: chatId,
        type: { $in: [ChatMessageType.IMAGE, ChatMessageType.VIDEO, ChatMessageType.AUDIO, ChatMessageType.DOCUMENT] }
      }, { type: 1, content: 1, createdAt: 1, senderId: 1 }).sort({ createdAt: -1 }).lean();

      return {
        chatId,
        type: 'group',
        name: group.name,
        image: group.image,
        mediaFiles,
        members: members.map(member => ({
          id: member._id,
          name: member.fullname,
          image: member.picture,
          isAdmin: group.admins.some(admin => admin.toString() === member._id.toString())
        }))
      };
    }

    throw new BadRequestException('Invalid chat id');
  }

  async createGroup(currentUserId: string, payload: CreateGroupDto) {
    const memberIds = [...new Set([currentUserId, ...payload.memberIds])].map(id => new Types.ObjectId(id));

    const group = await this.chatGroupModel.create({
      name: payload.name,
      image: payload.image,
      createdBy: new Types.ObjectId(currentUserId),
      admins: [new Types.ObjectId(currentUserId)],
      members: memberIds,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return {
      id: group._id,
      chatId: `group:${group._id.toString()}`,
      ...group.toObject()
    };
  }

  async updateGroup(currentUserId: string, groupId: string, payload: UpdateGroupDto) {
    const group = await this.chatGroupModel.findById(groupId);
    if (!group || group.deletedAt) {
      throw new NotFoundException('Chat group not found');
    }

    const isAdmin = group.admins.some(admin => admin.toString() === currentUserId);
    if (!isAdmin) {
      throw new ForbiddenException('Only group admins can update group');
    }

    if (payload.name !== undefined) {
      group.name = payload.name;
    }
    if (payload.image !== undefined) {
      group.image = payload.image;
    }

    if (payload.addMemberIds?.length) {
      const next = new Set(group.members.map(member => member.toString()));
      payload.addMemberIds.forEach(id => next.add(id));
      group.members = [...next].map(id => new Types.ObjectId(id));
    }

    if (payload.removeMemberIds?.length) {
      const removeSet = new Set(payload.removeMemberIds);
      group.members = group.members.filter(member => !removeSet.has(member.toString()));
      group.admins = group.admins.filter(admin => !removeSet.has(admin.toString()));
      this.ensureGroupHasAdmin(group);
    }

    group.updatedAt = new Date();
    await group.save();
    return group;
  }

  async exitGroup(currentUserId: string, groupId: string) {
    const group = await this.chatGroupModel.findById(groupId);
    if (!group || group.deletedAt) {
      throw new NotFoundException('Chat group not found');
    }

    group.members = group.members.filter(member => member.toString() !== currentUserId);
    group.admins = group.admins.filter(admin => admin.toString() !== currentUserId);
    this.ensureGroupHasAdmin(group);
    group.updatedAt = new Date();
    await group.save();

    return { ok: true };
  }

  async blockUser(currentUserId: string, targetUserId: string) {
    const settings = await this.getOrCreateSettings(currentUserId);
    const next = new Set((settings.blockedUsers ?? []).map(item => item.toString()));
    next.add(targetUserId);
    settings.blockedUsers = [...next].map(id => new Types.ObjectId(id));
    settings.updatedAt = new Date();
    await settings.save();

    return { ok: true };
  }

  async blockAndExitGroup(currentUserId: string, groupId: string) {
    const settings = await this.getOrCreateSettings(currentUserId);
    const next = new Set((settings.blockedGroups ?? []).map(item => item.toString()));
    next.add(groupId);
    settings.blockedGroups = [...next].map(id => new Types.ObjectId(id));
    settings.updatedAt = new Date();
    await settings.save();

    await this.exitGroup(currentUserId, groupId);
    return { ok: true };
  }

  async clearChat(currentUserId: string, chatId: string) {
    const settings = await this.getOrCreateSettings(currentUserId);

    if (chatId.startsWith('direct:')) {
      const otherUserId = chatId.replace('direct:', '');

      if (!otherUserId || otherUserId.includes(':')) {
        throw new BadRequestException('Invalid direct chat id');
      }

      await this.validateDirectTarget(currentUserId, otherUserId);
    } else if (chatId.startsWith('group:')) {
      const groupId = chatId.replace('group:', '');
      const group = await this.chatGroupModel.findById(groupId).lean<any>();
      if (!group || group.deletedAt) {
        throw new NotFoundException('Chat group not found');
      }

      const isMember = (group.members ?? []).some((member: any) => member.toString() === currentUserId);
      if (!isMember) {
        throw new ForbiddenException('You are not a member of this group');
      }
    } else {
      throw new BadRequestException('Invalid chat id');
    }

    const nextCleared = {
      ...((settings as any).clearedChats ?? {}),
      [chatId]: new Date()
    };

    (settings as any).clearedChats = nextCleared;
    settings.updatedAt = new Date();
    await settings.save();

    return { ok: true, chatId };
  }

}
