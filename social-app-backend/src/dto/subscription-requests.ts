import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserSubscriptions } from 'src/helpers/constants';


/**
 * Data Transfer Object (DTO) for fetching subscription plans.
 */
export class FetchSubscriptionPlans {
  /**
   * Subscription Id.
   */
  @ApiProperty({
    description: 'Subscription Id.',
    type: String,
    example: 'ObjectId("67853616abf87a4196fe226e")',
    required: false
  })
  @IsString()
  @IsOptional()
  _id?: string;

  /**
   * Name of the plan.
   */
  @ApiProperty({
    description: 'Name of the plan.',
    type: String,
    example: 'PLATINUM',
    required: false
  })
  @IsString()
  @IsOptional()
  name?: UserSubscriptions;

  /**
   * Validity of the plan in months.
   */
  @ApiProperty({
    description: 'Validity of the plan in months.',
    type: Number,
    example: '12',
    required: false
  })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  validity?: number;

  /**
   * Subscription price in USD.
   */
  @ApiProperty({
    description: 'Subscription price in USD.',
    type: String,
    example: '20',
    required: false
  })
  @IsString()
  @IsOptional()
  price?: string;

  /**
   * Subscription type: individual or business.
   */
  @ApiProperty({
    description: 'Subscription type: individual or business.',
    type: String,
    example: 'INDIVIDUAL',
    required: false
  })
  @IsString()
  @IsOptional()
  type?: UserSubscriptions;
}

/**
 * Data Transfer Object (DTO) for subscribing to a billing plan.
 */
export class SubscribeToPlan {
  /**
   * Subscription Id.
   */
  @ApiProperty({
    description: 'Subscription Id.',
    type: String,
    example: 'ObjectId("67853616abf87a4196fe226e")',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  _id: string;

  /**
   * Referral code.
   */
  @ApiProperty({
    description: 'Referral code.',
    type: String,
    example: 'EZ65AB12YZ',
    required: false
  })
  @IsString()
  @IsOptional()
  referral?: string;
}