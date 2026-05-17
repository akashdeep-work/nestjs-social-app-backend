import { IsNotEmpty, IsDate, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserSubscriptions } from 'src/helpers/constants';


/**
 * Data Transfer Object (DTO) for send referral code response.
 */
export class SendReferralCodeResponse {
  /**
   * Expiry date time of the referrer.
   */
  @ApiProperty({
    description: 'Expiry date time of the referrer.',
    type: Date,
    example: '2025-06-09T22:26:52.214Z'
  })
  @IsDate()
  @IsNotEmpty()
  expiresAt: Date;
}

/**
 * Data Transfer Object (DTO) for validate referral code response.
 */
export class ValidateReferralCodeResponse {
  /**
   * Validity status of the referrer.
   */
  @ApiProperty({
    description: 'Validity status of the referrer.',
    type: Boolean,
    example: 'true'
  })
  @IsBoolean()
  @IsNotEmpty()
  valid: boolean;

  /**
   * Subscription offered by the referral.
   */
  @ApiProperty({
    description: 'Subscription offered by the referral.',
    type: String,
    example: 'PLATINUM'
  })
  @IsBoolean()
  @IsNotEmpty()
  offers: UserSubscriptions;
}