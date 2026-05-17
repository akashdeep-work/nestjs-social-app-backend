import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ChatMessageType } from 'src/schemas/chat-message.schema';

export class ChatPaginationQueryDto {
  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Message id cursor. Returns messages older than this message id.' })
  @IsString()
  @IsOptional()
  before?: string;
}

export class ChatMediaPaginationQueryDto extends ChatPaginationQueryDto {
  @ApiPropertyOptional({ enum: ChatMessageType, description: 'Optional media type filter', enumName: 'ChatMediaType' })
  @IsEnum(ChatMessageType)
  @IsOptional()
  type?: ChatMessageType;
}

export class CreateGroupDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  image?: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  memberIds: string[];
}

export class UpdateGroupDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  addMemberIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  removeMemberIds?: string[];
}

export class SearchChatQueryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  query: string;
}

export class SendMessageApiDto {
  @ApiPropertyOptional({ description: 'Direct message recipient user id (legacy key)' })
  @IsMongoId()
  @IsOptional()
  receiverId?: string;

  @ApiPropertyOptional({ description: 'Direct message recipient user id (new key alias for receiverId)' })
  @IsMongoId()
  @IsOptional()
  recipientId?: string;

  @ApiPropertyOptional({ description: 'Group chat room id e.g. group:<id> (legacy key)' })
  @IsString()
  @IsOptional()
  groupId?: string;

  @ApiPropertyOptional({ description: 'Chat room id e.g. group:<id> or direct:<idA>:<idB> (new key alias for groupId)' })
  @IsString()
  @IsOptional()
  roomId?: string;

  @ApiProperty({ enum: ChatMessageType })
  @IsEnum(ChatMessageType)
  @IsNotEmpty()
  type: ChatMessageType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;
}


export class InitiateDirectChatDto {
  @ApiProperty({ description: 'Target user id to start an individual chat with' })
  @IsMongoId()
  @IsNotEmpty()
  userId: string;
}
