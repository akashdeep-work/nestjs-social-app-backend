import { IsEnum, IsMongoId, IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { ChatMessageType } from 'src/schemas/chat-message.schema';

export class ChatSocketMessageDto {
  @ValidateIf((payload: ChatSocketMessageDto) => !payload.groupId)
  @IsMongoId()
  @IsNotEmpty()
  receiverId?: string;

  @ValidateIf((payload: ChatSocketMessageDto) => !payload.receiverId)
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
