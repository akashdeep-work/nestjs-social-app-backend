import { IsEnum, IsIn, IsMongoId, IsNotEmpty, IsObject, IsOptional, IsString, ValidateIf } from 'class-validator';
import { ChatMessageType } from 'src/schemas/chat-message.schema';

export class RoomMembershipDto {
  @IsMongoId()
  @IsNotEmpty()
  roomId: string;
}

export class PresenceRequestDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: string;
}

export class ChatMessageEventDto {
  @IsMongoId()
  @IsNotEmpty()
  senderId: string;

  @ValidateIf((payload: ChatMessageEventDto) => !payload.roomId)
  @IsMongoId()
  @IsNotEmpty()
  receiverId?: string;

  @ValidateIf((payload: ChatMessageEventDto) => !payload.receiverId)
  @IsMongoId()
  @IsNotEmpty()
  roomId?: string;

  @IsEnum(ChatMessageType)
  @IsNotEmpty()
  type: ChatMessageType;

  @IsString()
  @IsNotEmpty()
  content: string;
}

export class CallEventDto {
  @IsString()
  @IsNotEmpty()
  callId: string;

  @IsMongoId()
  @IsNotEmpty()
  senderId: string;

  @ValidateIf((payload: CallEventDto) => !payload.roomId)
  @IsMongoId()
  @IsNotEmpty()
  targetId?: string;

  @ValidateIf((payload: CallEventDto) => !payload.targetId)
  @IsMongoId()
  @IsNotEmpty()
  roomId?: string;

  @IsOptional()
  @IsIn(['audio', 'video'])
  callType?: 'audio' | 'video';

  @IsOptional()
  @IsString()
  reason?: string;
}

export class WebRtcSignalDto {
  @IsString()
  @IsNotEmpty()
  callId: string;

  @IsMongoId()
  @IsNotEmpty()
  senderId: string;

  @ValidateIf((payload: WebRtcSignalDto) => !payload.roomId)
  @IsMongoId()
  @IsNotEmpty()
  targetId?: string;

  @ValidateIf((payload: WebRtcSignalDto) => !payload.targetId)
  @IsMongoId()
  @IsNotEmpty()
  roomId?: string;
}

export class WebRtcOfferDto extends WebRtcSignalDto {
  @IsObject()
  @IsNotEmpty()
  offer: Record<string, unknown>;
}

export class WebRtcAnswerDto extends WebRtcSignalDto {
  @IsObject()
  @IsNotEmpty()
  answer: Record<string, unknown>;
}

export class WebRtcIceCandidateDto extends WebRtcSignalDto {
  @IsObject()
  @IsNotEmpty()
  candidate: Record<string, unknown>;
}
