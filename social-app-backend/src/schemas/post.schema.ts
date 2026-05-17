import { Document, ObjectId, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MEDIA_TYPE, MediaType } from 'src/helpers/constants';

export type PostDocument = Post & Document<ObjectId>;


export class PostMedia {
  @Prop({ required: true, type: String })
  url: string;

  @Prop({ required: true, type: String, enum: Object.values(MEDIA_TYPE) })
  type: MediaType;
}

@Schema({ versionKey: false })
export class Post {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  authorId: Types.ObjectId;

  @Prop({ required: true, type: String })
  content: string;

  @Prop({ required: false, type: [Object], default: [] })
  media?: PostMedia[];

  @Prop({ required: false, type: [String], default: [] })
  mediaUrls?: string[];

  @Prop({ required: false, type: [Types.ObjectId], default: [] })
  likedBy?: Types.ObjectId[];

  @Prop({ required: false, type: Boolean, default: false })
  isStory?: boolean;

  @Prop({ required: true, type: Date })
  createdAt: Date;

  @Prop({ required: false, type: Date })
  updatedAt?: Date;

  @Prop({ required: false, type: Date })
  deletedAt?: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post)
  .index({ authorId: 1, createdAt: -1 })
  .index({ createdAt: -1 })
  .index(
    { content: 'text' },
    {
      name: 'post_search_text_idx',
      weights: { content: 10 },
      default_language: 'english'
    }
  );
