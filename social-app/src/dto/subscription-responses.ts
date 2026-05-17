import {
  IsArray,
  IsNotEmpty,
  IsObject
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionDocument } from 'src/schemas/subscription.schema';
import { Subscription } from './subscription';


/**
 * Data Transfer Object (DTO) for fetch subscription plan response.
 */
export class SubscriptionPlans {
  /**
   * Subscription plans.
   */
  @ApiProperty({
    description: 'Subscription plans.',
    type: Array<SubscriptionDocument>,
    example: '[]'
  })
  @IsArray()
  @IsNotEmpty()
  plans: Array<SubscriptionDocument>;
}

/**
 * Data Transfer Object (DTO) for subscribe plan response.
 */
export class SubscribedPlan {
  /**
   * Subscribed plan.
   */
  @ApiProperty({
    description: 'Subscribed plan.',
    type: Subscription,
    example: '{}'
  })
  @IsObject()
  @IsNotEmpty()
  plan: Subscription;
}