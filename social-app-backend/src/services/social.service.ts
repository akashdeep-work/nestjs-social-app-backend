import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Post, PostDocument } from 'src/schemas/post.schema';
import { User, UserDocument } from 'src/schemas/user.schema';
import {
  HOME_FEED_DEFAULT_LIMIT,
  HOME_RECOMMENDED_BUSINESS_LIMIT,
  HOME_STORIES_LIMIT,
  MEDIA_TYPE,
  UserRoles
} from 'src/helpers/constants';
import { CreatePostDto, HomeFeedQueryDto, PostMediaDto, UpdatePostDto } from 'src/dto/social.dto';
import { ChatService } from './chat.service';

@Injectable()
export class SocialService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly chatService: ChatService,
  ) {}

  private normalizePostMedia(media?: PostMediaDto[], mediaUrls?: string[]) {
    if (media !== undefined) {
      return {
        media,
        mediaUrls: media.map(item => item.url)
      };
    }

    const normalizedUrls = mediaUrls ?? [];
    return {
      media: normalizedUrls.map(url => ({ url, type: MEDIA_TYPE.IMAGE })),
      mediaUrls: normalizedUrls
    };
  }

  private mapPostResponse(post: any) {
    const media = post?.media?.length
      ? post.media
      : (post?.mediaUrls ?? []).map((url: string) => ({ url, type: MEDIA_TYPE.IMAGE }));

    return {
      ...post,
      media,
      mediaUrls: media.map((item: any) => item.url)
    };
  }

  async getHomeFeed(currentUserId: string, query: HomeFeedQueryDto) {
    const user = await this.userModel.findById(currentUserId).lean<any>();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? HOME_FEED_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const friends = (user.friends ?? []).map((friend: any) => friend.toString());
    const feedFilter: FilterQuery<PostDocument> = { deletedAt: { $exists: false } };

    const [posts, postsTotal, stories, recommendedBusinesses, totalUnreadMessageCount] = await Promise.all([
      this.postModel
        .find(feedFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.postModel.countDocuments(feedFilter),
      this.postModel
        .find({
          deletedAt: { $exists: false },
          isStory: true,
          authorId: { $in: friends.map(id => new Types.ObjectId(id)) }
        })
        .sort({ createdAt: -1 })
        .limit(HOME_STORIES_LIMIT)
        .lean(),
      this.userModel
        .find(
          {
            _id: {
              $nin: [new Types.ObjectId(currentUserId), ...friends.map((id: string) => new Types.ObjectId(id))]
            },
            $or: [
              { userType: UserRoles.BUSINESS },
              { accountType: UserRoles.BUSINESS },
              { type: UserRoles.BUSINESS },
              { role: UserRoles.BUSINESS }
            ]
          },
          { fullname: 1, username: 1, picture: 1, bio: 1 }
        )
        .sort({ createdAt: -1 })
        .limit(HOME_RECOMMENDED_BUSINESS_LIMIT)
        .lean(),
      this.chatService.getTotalUnreadCount(currentUserId)
    ]);

    return {
      posts: posts.map(post => this.mapPostResponse(post)),
      stories: stories.map(story => this.mapPostResponse(story)),
      recommendedBusinesses,
      totalUnreadMessageCount,
      pagination: {
        page,
        limit,
        total: postsTotal,
        totalPages: Math.ceil(postsTotal / limit)
      }
    };
  }

  async createPost(currentUserId: string, payload: CreatePostDto) {
    const normalizedMedia = this.normalizePostMedia(payload.media, payload.mediaUrls);

    const post = await this.postModel.create({
      authorId: new Types.ObjectId(currentUserId),
      content: payload.content,
      media: normalizedMedia.media,
      mediaUrls: normalizedMedia.mediaUrls,
      isStory: payload.isStory ?? false,
      likedBy: [],
      createdAt: new Date()
    });

    return this.mapPostResponse(post.toObject());
  }

  async editPost(currentUserId: string, postId: string, payload: UpdatePostDto) {
    const post = await this.postModel.findById(postId);
    if (!post || post.deletedAt) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId.toString() !== currentUserId) {
      throw new ForbiddenException('You can only edit your own post');
    }

    if (payload.content !== undefined) {
      post.content = payload.content;
    }

    if (payload.media !== undefined || payload.mediaUrls !== undefined) {
      const normalizedMedia = this.normalizePostMedia(payload.media, payload.mediaUrls);
      post.media = normalizedMedia.media as any;
      post.mediaUrls = normalizedMedia.mediaUrls;
    }

    post.updatedAt = new Date();
    await post.save();

    return this.mapPostResponse(post.toObject());
  }

  async deletePost(currentUserId: string, postId: string) {
    const post = await this.postModel.findById(postId);
    if (!post || post.deletedAt) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId.toString() !== currentUserId) {
      throw new ForbiddenException('You can only delete your own post');
    }

    post.deletedAt = new Date();
    post.updatedAt = new Date();
    await post.save();
    return { ok: true };
  }

  async likePost(currentUserId: string, postId: string) {
    const post = await this.postModel.findById(postId);
    if (!post || post.deletedAt) {
      throw new NotFoundException('Post not found');
    }

    const userId = new Types.ObjectId(currentUserId);
    const alreadyLiked = (post.likedBy ?? []).some(item => item.toString() === currentUserId);

    post.likedBy = alreadyLiked
      ? (post.likedBy ?? []).filter(item => item.toString() !== currentUserId)
      : [...(post.likedBy ?? []), userId];

    post.updatedAt = new Date();
    await post.save();

    return {
      liked: !alreadyLiked,
      likesCount: post.likedBy.length
    };
  }

  async savePostForLater(currentUserId: string, postId: string) {
    const postExists = await this.postModel.exists({ _id: new Types.ObjectId(postId), deletedAt: { $exists: false } });
    if (!postExists) {
      throw new NotFoundException('Post not found');
    }

    const user = await this.userModel.findById(currentUserId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentSaved = (user as any).savedPosts ?? [];
    const alreadySaved = currentSaved.some((item: any) => item.toString() === postId);
    (user as any).savedPosts = alreadySaved
      ? currentSaved.filter((item: any) => item.toString() !== postId)
      : [...currentSaved, new Types.ObjectId(postId)];

    user.updatedAt = new Date();
    await user.save();

    return { saved: !alreadySaved };
  }

}
