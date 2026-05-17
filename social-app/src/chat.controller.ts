import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { ChatService } from './services/chat.service';
import { ChatMediaPaginationQueryDto, ChatPaginationQueryDto, CreateGroupDto, SearchChatQueryDto, SendMessageApiDto, UpdateGroupDto } from './dto/chat-api.dto';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  private resolveCurrentUserId(currentUser: any): string {
    return String(currentUser?._id || currentUser?.sub || '');
  }

  private normalizeSendMessagePayload(body: SendMessageApiDto, currentUserId: string): SendMessageApiDto {
    const normalized = { ...body };

    if (!normalized.receiverId && normalized.recipientId) {
      normalized.receiverId = normalized.recipientId;
    }

    if (!normalized.groupId && normalized.roomId) {
      if (normalized.roomId.startsWith('group:')) {
        normalized.groupId = normalized.roomId;
      }

      if (normalized.roomId.startsWith('direct:') && !normalized.receiverId) {
        const parts = normalized.roomId.replace('direct:', '').split(':').filter(Boolean);
        if (parts.length === 2) {
          normalized.receiverId = parts[0] === currentUserId ? parts[1] : parts[0];
        }
      }
    }

    return normalized;
  }

  @Get('/list')
  @ApiOperation({ summary: 'Get list of chats for current user' })
  getChats(@CurrentUser() currentUser: any) {
    return this.chatService.getChatList(this.resolveCurrentUserId(currentUser));
  }


  @Get('/search')
  @ApiOperation({ summary: 'Search chats from authenticated user chats list' })
  searchChats(@CurrentUser() currentUser: any, @Query() query: SearchChatQueryDto) {
    return this.chatService.searchChats(this.resolveCurrentUserId(currentUser), query.query);
  }

  @Get('/:chatId/messages')
  @ApiOperation({ summary: 'Get chat messages for a single chat with pagination' })
  getChatMessages(
    @CurrentUser() currentUser: any,
    @Param('chatId') chatId: string,
    @Query() query: ChatPaginationQueryDto
  ) {
    return this.chatService.getChatMessages(this.resolveCurrentUserId(currentUser), chatId, query.limit, query.before);
  }


  @Get('/direct/:userId/messages')
  @ApiOperation({ summary: 'Get direct chat messages by target user id (useful from user profile)' })
  getDirectMessagesByUserId(
    @CurrentUser() currentUser: any,
    @Param('userId') userId: string,
    @Query() query: ChatPaginationQueryDto
  ) {
    return this.chatService.getDirectChatMessagesByUserId(this.resolveCurrentUserId(currentUser), userId, query.limit, query.before);
  }


  @Patch('/:chatId/read')
  @ApiOperation({ summary: 'Mark chat messages as read for authenticated user' })
  markChatAsRead(@CurrentUser() currentUser: any, @Param('chatId') chatId: string) {
    return this.chatService.markChatAsRead(this.resolveCurrentUserId(currentUser), chatId);
  }

  @Get('/:chatId/details')
  @ApiOperation({ summary: 'Get details for individual/group chat' })
  getChatDetails(@CurrentUser() currentUser: any, @Param('chatId') chatId: string) {
    return this.chatService.getChatDetails(this.resolveCurrentUserId(currentUser), chatId);
  }

  @Get('/:chatId/media-files')
  @ApiOperation({ summary: 'Get paginated media/document files shared in a chat' })
  getChatMediaFiles(
    @CurrentUser() currentUser: any,
    @Param('chatId') chatId: string,
    @Query() query: ChatMediaPaginationQueryDto
  ) {
    return this.chatService.getChatMediaFiles(
      this.resolveCurrentUserId(currentUser),
      chatId,
      query.limit,
      query.before,
      query.type
    );
  }


  @Post('/messages')
  @ApiOperation({ summary: 'Send message via API' })
  async sendMessage(@CurrentUser() currentUser: any, @Body() body: SendMessageApiDto) {
    const currentUserId = this.resolveCurrentUserId(currentUser);
    const normalized = this.normalizeSendMessagePayload(body, currentUserId);
    if (!normalized.receiverId && !normalized.groupId) {
      throw new BadRequestException('receiverId/recipientId or groupId/roomId is required');
    }

    const saved = await this.chatService.sendMessageViaApi(currentUserId, normalized);
    return this.chatService.toRealtimeMessage(saved);
  }

  @Post('/groups')
  @ApiOperation({ summary: 'Create new group' })
  createGroup(@CurrentUser() currentUser: any, @Body() body: CreateGroupDto) {
    return this.chatService.createGroup(this.resolveCurrentUserId(currentUser), body);
  }

  @Patch('/groups/:groupId')
  @ApiOperation({ summary: 'Update existing group if current user is admin' })
  updateGroup(
    @CurrentUser() currentUser: any,
    @Param('groupId') groupId: string,
    @Body() body: UpdateGroupDto
  ) {
    return this.chatService.updateGroup(this.resolveCurrentUserId(currentUser), groupId, body);
  }

  @Post('/groups/:groupId/exit')
  @ApiOperation({ summary: 'Exit from group' })
  exitGroup(@CurrentUser() currentUser: any, @Param('groupId') groupId: string) {
    return this.chatService.exitGroup(this.resolveCurrentUserId(currentUser), groupId);
  }


  @Post('/:chatId/clear')
  @ApiOperation({ summary: 'Clear chat for authenticated user only' })
  clearChat(@CurrentUser() currentUser: any, @Param('chatId') chatId: string) {
    return this.chatService.clearChat(this.resolveCurrentUserId(currentUser), chatId);
  }

  @Post('/users/:userId/block')
  @ApiOperation({ summary: 'Block user' })
  blockUser(@CurrentUser() currentUser: any, @Param('userId') userId: string) {
    return this.chatService.blockUser(this.resolveCurrentUserId(currentUser), userId);
  }

  @Post('/groups/:groupId/block-exit')
  @ApiOperation({ summary: 'Block and exit from group' })
  blockAndExitGroup(@CurrentUser() currentUser: any, @Param('groupId') groupId: string) {
    return this.chatService.blockAndExitGroup(this.resolveCurrentUserId(currentUser), groupId);
  }

}
