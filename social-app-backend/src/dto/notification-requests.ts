import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { Types } from 'mongoose';

/**
 * Data Transfer Object (DTO) for registering device.
 */
export class RegisterDeviceRequest {
  @IsString()
  @IsNotEmpty()
  userId: Types.ObjectId;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsBoolean()
  @IsOptional()
  primary?: boolean = false;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Data Transfer Object (DTO) for dispatching notification.
 */
export class DispatchNotificationRequest {
  @IsString()
  @IsNotEmpty()
  userId: Types.ObjectId;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}