import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { CreatePostDto, HomeFeedQueryDto, UpdatePostDto } from './dto/social.dto';
import { SocialService } from './services/social.service';

@ApiTags('Social')
@ApiBearerAuth()
@Controller('/social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  private resolveCurrentUserId(currentUser: any): string {
    return String(currentUser?._id || currentUser?.sub || '');
  }

  @Get('/home')
  @ApiOperation({ summary: 'Get home feed containing posts, stories and recommended businesses' })
  getHome(@CurrentUser() currentUser: any, @Query() query: HomeFeedQueryDto) {
    return this.socialService.getHomeFeed(this.resolveCurrentUserId(currentUser), query);
  }

  @Post('/posts')
  @ApiOperation({ summary: 'Create a new post' })
  createPost(@CurrentUser() currentUser: any, @Body() body: CreatePostDto) {
    return this.socialService.createPost(this.resolveCurrentUserId(currentUser), body);
  }

  @Patch('/posts/:postId')
  @ApiOperation({ summary: 'Edit an existing post' })
  editPost(@CurrentUser() currentUser: any, @Param('postId') postId: string, @Body() body: UpdatePostDto) {
    return this.socialService.editPost(this.resolveCurrentUserId(currentUser), postId, body);
  }

  @Delete('/posts/:postId')
  @ApiOperation({ summary: 'Delete a post' })
  deletePost(@CurrentUser() currentUser: any, @Param('postId') postId: string) {
    return this.socialService.deletePost(this.resolveCurrentUserId(currentUser), postId);
  }

  @Post('/posts/:postId/like')
  @ApiOperation({ summary: 'Like/unlike a post' })
  likePost(@CurrentUser() currentUser: any, @Param('postId') postId: string) {
    return this.socialService.likePost(this.resolveCurrentUserId(currentUser), postId);
  }

  @Post('/posts/:postId/save')
  @ApiOperation({ summary: 'Save/unsave a post for later view' })
  savePost(@CurrentUser() currentUser: any, @Param('postId') postId: string) {
    return this.socialService.savePostForLater(this.resolveCurrentUserId(currentUser), postId);
  }




}
