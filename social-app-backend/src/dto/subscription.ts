import { IsString, IsNotEmpty, IsBoolean, IsDate, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserSubscriptions } from 'src/helpers/constants';
import { ObjectId, Types } from 'mongoose';


/**
 * Data Transfer Object (DTO) for representing the user subscription.
 */
export class Subscription {
  /**
   * Subscription Id
   */
  @ApiProperty({
    description: 'Subscription Id',
    type: Types.ObjectId,
    example: 'ObjectId("67853616abf87a4196fe226e")'
  })
  @IsString()
  @IsOptional()
  id?: ObjectId;

  /**
   * Subscription name
   */
  @ApiProperty({
    description: 'Subscription name',
    type: String,
    example: 'PLATINUM'
  })
  @IsString()
  @IsNotEmpty()
  name: UserSubscriptions;

  /**
   * Validity in months
   */
  @ApiProperty({
    description: 'Validity in months',
    type: Number,
    example: '12'
  })
  @IsString()
  @IsNotEmpty()
  validity: number;

  /**
   * Subscription type: individual or business.
   */
  @ApiProperty({
    description: 'Subscription type: individual or business.',
    type: String,
    example: 'INDIVIDUAL'
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  /**
   * Active status
   */
  @ApiProperty({
    description: 'Active status',
    type: Boolean,
    example: 'true'
  })
  @IsBoolean()
  @IsNotEmpty()
  active: boolean;

  /**
   * Plan expiry date time
   */
  @ApiProperty({
    description: 'Plan expiry date time',
    type: Date,
    example: '2025-06-09T22:26:52.214Z'
  })
  @IsDate()
  @IsOptional()
  expiresAt?: Date;
}