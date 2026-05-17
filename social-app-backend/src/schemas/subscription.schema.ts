import { Document, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { SubscriptionFeatures, UserSubscriptions, UserRoles as SubscriptionType } from 'src/helpers/constants';

// Define the type for a Subscription Document
export type SubscriptionDocument = Subscription & Document;

// Define the schema for the Subscription model
@Schema({ strict: false })
export class Subscription {
  // Subscription name
  @Prop({ required: true, type: String })
  name: UserSubscriptions = UserSubscriptions.BASIC;

  // Subscription price
  @Prop({ required: true, type: String })
  price: string;

  // Currency for the subscription price
  @Prop({ required: true, type: String })
  currency: string;

  // Validity in months
  @Prop({ required: true, type: Number })
  validity: number;

  // Description of the plan
  @Prop({ required: true, type: String })
  description: string;

  // Features of the plan
  @Prop({ required: true, type: Array<string> })
  features: Array<SubscriptionFeatures>;

  // Active status
  @Prop({ required: true, type: Boolean })
  active: boolean;

  // Subscription type: individual or business.
  @Prop({ required: true, type: String })
  type: SubscriptionType = SubscriptionType.INDIVIDUAL;

  // Date of the user creation.
  @Prop({ required: true, type: Date })
  createdAt: Date;

  // Date of the user last update.
  @Prop({ required: false, type: Date })
  updatedAt?: Date;
}

// Create a Subscription Schema using SchemaFactory and index it by the selected properties
export const SubscriptionSchema = SchemaFactory.createForClass(Subscription).index({ name: 1 }).index({ price: 1 }).index({ validity: 1 });

export type UpdateSubscriptionDocument = Partial<SubscriptionDocument>;
