import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, Types } from 'mongoose';

export type ChatGroupDocument = ChatGroup & Document<ObjectId>;

@Schema({ collection: 'chat_groups' })
export class ChatGroup {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: false, type: String })
  image?: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ required: true, type: [Types.ObjectId], ref: 'User' })
  admins: Types.ObjectId[];

  @Prop({ required: true, type: [Types.ObjectId], ref: 'User' })
  members: Types.ObjectId[];

  @Prop({ required: false, type: Date })
  deletedAt?: Date;

  @Prop({ required: true, type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ required: false, type: Date })
  updatedAt?: Date;
}

export const ChatGroupSchema = SchemaFactory.createForClass(ChatGroup)
  .index({ members: 1, updatedAt: -1 })
  .index({ admins: 1 })
  .index({ deletedAt: 1 });
