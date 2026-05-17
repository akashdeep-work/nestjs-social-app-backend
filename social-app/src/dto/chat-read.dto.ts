import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class ChatReadDto {
  @IsMongoId()
  @IsNotEmpty()
  messageId: string;

  @IsString()
  @IsNotEmpty()
  roomId: string;
}
