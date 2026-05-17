import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';
import { ChatMessageType } from 'src/schemas/chat-message.schema';

export class ChatMessageDto {
  @IsMongoId()
  @IsNotEmpty()
  senderId: string;

  @ValidateIf((payload: ChatMessageDto) => !payload.groupId)
  @IsMongoId()
  @IsNotEmpty()
  receiverId?: string;

  @ValidateIf((payload: ChatMessageDto) => !payload.receiverId)
  @IsString()
  @IsNotEmpty()
  groupId?: string;

  @IsEnum(ChatMessageType)
  @IsNotEmpty()
  type: ChatMessageType;

  @IsString()
  @IsNotEmpty()
  content: string;
}
