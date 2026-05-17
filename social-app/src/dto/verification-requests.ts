import {
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VerificationTypes } from 'src/helpers/constants';
import { Transform } from 'class-transformer';


/**
 * Data Transfer Object (DTO) for sending verification code.
 */
export class SendVerificationCodeRequest {
  /**
   * Email or phone number of the user.
   */
  @ApiProperty({
    description: 'Email or phone number of the user.',
    type: String,
    example: 'user@social-app.com'
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.toLowerCase().trim())
  handle: string;

  /**
   * Verification type: signup/login.
   */
  @ApiProperty({
    description: 'Verification type: signup/login.',
    type: String,
    example: 'LOGIN'
  })
  @IsString()
  @IsNotEmpty()
  type: VerificationTypes;
}

/**
 * Data Transfer Object (DTO) for sending verification code.
 */
export class VerifyCodeRequest extends SendVerificationCodeRequest {
  /**
   * Verification code.
   */
  @ApiProperty({
    description: 'Verification code.',
    type: String,
    example: '123456'
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}