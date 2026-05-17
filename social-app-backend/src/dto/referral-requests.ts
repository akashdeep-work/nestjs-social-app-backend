import {
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

import { ReferralTypes } from 'src/helpers/constants';


/**
 * Data Transfer Object (DTO) for sending referral code.
 */
export class SendReferralCodeRequest {
  /**
   * Email of the user.
   */
  @ApiProperty({
    description: 'Email of the user.',
    type: String,
    example: 'user@social-app.com'
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.toLowerCase().trim())
  to: string;

  /**
   * Referral type: student/business.
   */
  @ApiProperty({
    description: 'Referral type: student/business.',
    type: String,
    example: 'BUSINESS'
  })
  @IsString()
  @IsNotEmpty()
  type: ReferralTypes;
}

/**
 * Data Transfer Object (DTO) for validating referral code.
 */
export class ValidateReferralCodeRequest {
  /**
   * Referral code.
   */
  @ApiProperty({
    description: 'Referral code.',
    type: String,
    example: 'EZ65AB12YZ'
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}