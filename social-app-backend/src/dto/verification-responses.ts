import { IsString, IsNotEmpty, IsDate, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VerificationTypes } from 'src/helpers/constants';


/**
 * Data Transfer Object (DTO) for send verification code response.
 */
export class VerificationCodeResponse {
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

  /**
   * Expiry date time of the plan.
   */
  @ApiProperty({
    description: 'Expiry date time of the plan.',
    type: Date,
    example: '2025-06-09T22:26:52.214Z'
  })
  @IsDate()
  @IsOptional()
  expiresAt?: Date;

  /**
   * Verified status.
   */
  @ApiProperty({
    description: 'Verified status.',
    type: Boolean,
    example: 'true'
  })
  @IsBoolean()
  @IsOptional()
  verified?: boolean;
}