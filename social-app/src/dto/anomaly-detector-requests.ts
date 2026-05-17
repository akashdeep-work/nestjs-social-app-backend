import {
  IsBoolean,
  IsNotEmpty,
  IsString,
} from 'class-validator';


/**
 * Data Transfer Object (DTO) for login event.
 */
export class LoginEvent {

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  ip: string;

  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsString()
  @IsNotEmpty()
  userAgent: string;

  @IsString()
  @IsBoolean()
  isFailedAttempt: boolean;
}