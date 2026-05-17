import { Document, ObjectId, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { PermissionDocument } from './permission.schema';
import { UserRoles } from 'src/helpers/constants';

// Define the type for a Role Document
export type RoleDocument = Role & Document<ObjectId>;

// Define the schema for the Role model
@Schema({ strict: false })
export class Role {
  @Prop({ required: true, type: String })
  name: UserRoles;
  
  @Prop({ required: true, type: String })
  displayName: string;
  
  @Prop({ required: true, type: String })
  description: string;

  @Prop({ required: true, type: Array<Types.ObjectId>, ref: 'Permission' })
  permissions: Array<Types.ObjectId>;
  
  @Prop({ required: true, type: Boolean })
  isAssignable: boolean;
  
  @Prop({ required: true, type: Boolean })
  deleted: boolean;
}

// Create a Role Schema using SchemaFactory and index it by the 'name' property
export const RoleSchema = SchemaFactory.createForClass(Role).index({ name: 1 });