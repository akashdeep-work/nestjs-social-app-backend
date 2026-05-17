import { Document, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { VerificationTypes } from 'src/helpers/constants';

// Define the type for a Verification Document
export type VerificationDocument = Verification & Document;

// Define the schema for the Verification model
@Schema({ strict: false })
export class Verification {
  // Email or phone number of the user
  @Prop({ required: true, type: String, unique: true })
  handle: string;
  
  // One time verification code.
  @Prop({ required: true, type: String })
  code: string;

  // Verification type: signup/login.
  @Prop({ required: true, type: String })
  type: VerificationTypes;

  // Verified status.
  @Prop({ required: true, type: Boolean })
  verified: boolean = false;

  // Expiry date-time for the verification code.
  @Prop({ required: true, type: Date })
  expiresAt: Date;

  // Date of the verification code creation.
  @Prop({ required: true, type: Date })
  createdAt: Date;

  // Date of the verification last update.
  @Prop({ required: false, type: Date })
  updatedAt?: Date;
}

// Create a Verification Schema using SchemaFactory and index it by the selected properties
export const VerificationSchema = SchemaFactory.createForClass(Verification).index({ handle: 1 });

export type UpdateVerificationDocument = Partial<VerificationDocument>;
