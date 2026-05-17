import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, Types } from 'mongoose';

export type ChatMessageDocument = ChatMessage & Document<ObjectId>;

export enum ChatMessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  CALL = 'call'
}

@Schema({ collection: 'chat_messages' })
export class ChatMessage {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  senderId: Types.ObjectId;

  @Prop({ required: false, type: Types.ObjectId, ref: 'User' })
  receiverId?: Types.ObjectId;

  @Prop({ required: false, type: String })
  groupId?: string;

  @Prop({ required: true, enum: ChatMessageType, type: String })
  type: ChatMessageType;

  @Prop({ required: true, type: String })
  content: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  readBy: Types.ObjectId[];

  @Prop({ required: true, type: Date, default: Date.now })
  createdAt: Date;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage)
  .index({ senderId: 1, createdAt: -1 })
  .index({ receiverId: 1, createdAt: -1 })
  .index({ groupId: 1, createdAt: -1 })
  .index({ receiverId: 1, readBy: 1, createdAt: -1 })
  .index({ groupId: 1, readBy: 1, createdAt: -1 });
