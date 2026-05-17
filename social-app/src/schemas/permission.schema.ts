import { Document, ObjectId, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Define the type for a Permission Document
export type PermissionDocument = Permission & Document<ObjectId>;

// Define the schema for the Permission model
@Schema({ strict: false })
export class Permission {
  @Prop({ required: true, type: String })
  name: string;
  
  @Prop({ required: true, type: String })
  displayName: string;
  
  @Prop({ required: true, type: String })
  description: string;
}

// Create a Permission Schema using SchemaFactory and index it by the 'name' property
export const PermissionSchema = SchemaFactory.createForClass(Permission).index({ name: 1 });