import { Document, ObjectId, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { ReferralTypes } from 'src/helpers/constants';

// Define the type for a Referral Document
export type ReferralDocument = Referral & Document<ObjectId>;

// Define the schema for the Referral model
@Schema({ strict: false })
export class Referral {
  @Prop({ required: true, type: String })
  code: string;

  @Prop({ required: true, type: String })
  to: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  from: Types.ObjectId;

  // Referral type: student/business.
  @Prop({ required: true, type: String })
  type: ReferralTypes;
  
  @Prop({ required: true, type: String })
  url: string;

  @Prop({ required: true, type: Date })
  expiresAt: Date;
  
  @Prop({ required: true, type: Boolean })
  used: boolean = false;

  // Date of the referral creation.
  @Prop({ required: true, type: Date })
  createdAt: Date;

  // Date of the referral last update.
  @Prop({ required: false, type: Date })
  updatedAt?: Date;
}

// Create a Referral Schema using SchemaFactory and index it by the 'to' property
export const ReferralSchema = SchemaFactory.createForClass(Referral).index({ to: 1 });

export type UpdateReferralDocument = Partial<ReferralDocument>;