import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, Types } from 'mongoose';

export type ChatUserSettingsDocument = ChatUserSettings & Document<ObjectId>;

@Schema({ collection: 'chat_user_settings' })
export class ChatUserSettings {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', unique: true })
  userId: Types.ObjectId;

  @Prop({ required: false, type: [Types.ObjectId], ref: 'User', default: [] })
  blockedUsers?: Types.ObjectId[];

  @Prop({ required: false, type: [Types.ObjectId], ref: 'ChatGroup', default: [] })
  blockedGroups?: Types.ObjectId[];

  @Prop({ required: false, type: [String], default: [] })
  deletedDirectChats?: string[];

  @Prop({ required: false, type: Map, of: Date, default: {} })
  clearedChats?: Record<string, Date>;

  @Prop({ required: true, type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ required: false, type: Date })
  updatedAt?: Date;
}

export const ChatUserSettingsSchema = SchemaFactory.createForClass(ChatUserSettings)
  .index({ userId: 1 }, { unique: true });
