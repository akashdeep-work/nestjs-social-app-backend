import {
  IsBoolean,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { Types } from 'mongoose';

/**
 * Data Transfer Object (DTO) for register device response.
 */
export class RegisterDeviceResponse {
  @IsBoolean()
  @IsNotEmpty()
  ok: boolean;
}

/**
 * Data Transfer Object (DTO) for dispatch notification response.
 */
export class DispatchNotificationResponse {
  @IsBoolean()
  @IsNotEmpty()
  ok: boolean;

  @IsString()
  @IsNotEmpty()
  id: Types.ObjectId;
}