import { Document, ObjectId, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Define the type for a Interest Document
export type InterestDocument = Interest & Document<ObjectId>;

// Define the schema for the Interest model
@Schema({ timestamps: true, strict: false })
export class Interest {
  @Prop({ required: true, type: String, trim: true })
  name: string;
  
  @Prop({ required: true, type: Boolean, default: false })
  deleted: boolean;
}

// Create a Interest Schema using SchemaFactory and index it by the 'name' property
export const InterestSchema = SchemaFactory.createForClass(Interest).index({ name: 'text' });