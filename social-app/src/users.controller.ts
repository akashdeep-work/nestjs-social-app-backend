import { Body, Controller, Get, Headers, HttpCode, HttpException, HttpStatus, Param, Post, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuditLogsService } from './services/logging/audit-logs.service';
import { UsersService } from './services/users.service';
import { UserLoginRequest, UserSignupRequest, FetchUserInfoRequest, SendPasswordResetCodeRequest, UpdateUserRequest, PasswordResetRequest, FetchUserInterestsRequest, SearchUsersRequest, FriendActionRequest, FriendRequestsListRequest } from './dto/users-requests';
import { FetchUserInfoResponse, PasswordResetResponse, UserLoginResponse } from './dto/users-responses';
import { ApiBadRequestResponse, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IllegalStateError } from './exceptions/illegal-state.error';
import { Public } from './auth/decorators/public.decorator';
import { VerificationCodeResponse } from './dto/verification-responses';
import { OptionalJwtAuthGuard } from './auth/guards/optional-jwt-auth.guard';
import { ClientIp, CurrentUser } from './auth/decorators/current-user.decorator';
import { UserInterests } from './dto/user';

@ApiTags('Users') // Add a tag for better organization in Swagger UI
@Controller('/users')
export class UserController {
  constructor(
    private readonly userService: UsersService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  /**
   * Login user.
   * @returns User data.
   */
  @Public()
  @Post('/login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Login user',
    description: 'Log in the user via email, phone or username'
  })
  @ApiResponse({ status: 200, description: 'Login user', type: UserLoginResponse })
  @ApiBadRequestResponse({ description: 'Unable to login' })
  public async login(
    @Body() request: UserLoginRequest,
    @Headers('User-Agent') userAgent: string,
    @ClientIp() ip: string
  ): Promise<UserLoginResponse> {
    const logEventPayload = {};
    this.auditLogsService.createLogEvent(
      this.auditLogsService.getAuditLogParams(
        'default',
        'userLogin',
        'Log in the user via email, phone or username',
        'POST'
      ),
      JSON.stringify(logEventPayload)
    );
    try {
      return await this.userService.login(request, userAgent, ip);
    } catch (error) {
      if (error instanceof IllegalStateError) {
        throw new HttpException(
          {
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            error: error
          },
          HttpStatus.UNPROCESSABLE_ENTITY
        );
      }
      throw error; // Re-throw other errors
    }
  }

  /**
   * Signup user.
   * @returns User data.
   */
  @Public()
  @Post('/signup')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Signup user',
    description: 'Signup the user'
  })
  @ApiResponse({ status: 200, description: 'Signup user', type: UserLoginResponse })
  @ApiBadRequestResponse({ description: 'Unable to signup' })
  public async signupEmail(@Body() request: UserSignupRequest ): Promise<UserLoginResponse> {
    const logEventPayload = {};
    this.auditLogsService.createLogEvent(
      this.auditLogsService.getAuditLogParams(
        'default',
        'signupEmail',
        'Signup the user',
        'POST'
      ),
      JSON.stringify(logEventPayload)
    );
    try {
      return await this.userService.signup(request);
    } catch (error) {
      if (error instanceof IllegalStateError) {
        throw new HttpException(
          {
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            error: error
          },
          HttpStatus.UNPROCESSABLE_ENTITY
        );
      }
      throw error; // Re-throw other errors
    }
  }

  /**
   * Fetch user info.
   * @returns A list of user accounts.
   */
  @Public()
  @Post('/info')
  @HttpCode(200)
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Fetch user info.',
    description: 'Fetch user info by email or phone'
  })
  @ApiResponse({ status: 200, description: 'Fetch user info by email or phone', type: FetchUserInfoResponse })
  @ApiBadRequestResponse({ description: 'Unable to fetch user info' })
  public async fetchUserInfo(
    @Body() request: FetchUserInfoRequest,
    @CurrentUser() user: any
  ): Promise<FetchUserInfoResponse> {
    const logEventPayload = {};
    this.auditLogsService.createLogEvent(
      this.auditLogsService.getAuditLogParams(
        'default',
        'fetchUserInfo',
        'Fetch user info',
        'POST'
      ),
      JSON.stringify(logEventPayload)
    );
    try {
      return await this.userService.fetchUserInfo(request, user);
    } catch (error) {
      if (error instanceof IllegalStateError) {
        throw new HttpException(
          {
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            error: error
          },
          HttpStatus.UNPROCESSABLE_ENTITY
        );
      }
      throw error; // Re-throw other errors
    }
  }

  /**
   * Update user info.
   * @returns User info after update.
   */
  @Post('/update')
  @HttpCode(200)
  @ApiBearerAuth()
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  @ApiOperation({
    summary: 'Update user info.',
    description: 'Update user info like name, preferences, etc.'
  })
  @ApiResponse({ status: 200, description: 'Update user info like name, preferences, etc.', type: UserLoginResponse })
  @ApiBadRequestResponse({ description: 'Unable to fetch user info' })
  public async updateUser(
    @Body() request: UpdateUserRequest,
    @CurrentUser() user: any
  ): Promise<UserLoginResponse> {
    const logEventPayload = {};
    this.auditLogsService.createLogEvent(
      this.auditLogsService.getAuditLogParams(
        'default',
        'updateUser',
        'Update user info',
        'POST'
      ),
      JSON.stringify(logEventPayload)
    );
    try {
      return await this.userService.updateUserInfo(user.sub, request);
    } catch (error) {
      if (error instanceof IllegalStateError) {
        throw new HttpException(
          {
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            error: error
          },
          HttpStatus.UNPROCESSABLE_ENTITY
        );
      }
      throw error; // Re-throw other errors
    }
  }

  /**
   * Send password reset code.
   * @returns Reset password response.
   */
  @Public()
  @Post('/password/send')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Send password reset code.',
    description: 'Send password reset code to email or phone.'
  })
  @ApiResponse({ status: 200, description: 'Send password reset code to email or phone.', type: VerificationCodeResponse })
  @ApiBadRequestResponse({ description: 'Unable to send password reset code' })
  public async sendPasswordResetCode(@Body() request: SendPasswordResetCodeRequest ): Promise<VerificationCodeResponse> {
    const logEventPayload = {};
    this.auditLogsService.createLogEvent(
      this.auditLogsService.getAuditLogParams(
        'default',
        'sendPasswordResetCode',
        'Send password reset code',
        'POST'
      ),
      JSON.stringify(logEventPayload)
    );
    try {
      return await this.userService.sendPasswordResetCode(request);
    } catch (error) {
      if (error instanceof IllegalStateError) {
        throw new HttpException(
          {
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            error: error
          },
          HttpStatus.UNPROCESSABLE_ENTITY
        );
      }
      throw error; // Re-throw other errors
    }
  }

  /**
   * Reset password.
   * @returns Reset password response.
   */
  @Public()
  @Post('/password/reset')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Reset password.',
    description: 'Reset password.'
  })
  @ApiResponse({ status: 200, description: 'Reset password.', type: PasswordResetResponse })
  @ApiBadRequestResponse({ description: 'Unable to reset password' })
  public async resetPassword(@Body() request: PasswordResetRequest ): Promise<PasswordResetResponse> {
    const logEventPayload = {};
    this.auditLogsService.createLogEvent(
      this.auditLogsService.getAuditLogParams(
        'default',
        'resetPassword',
        'Reset password.',
        'POST'
      ),
      JSON.stringify(logEventPayload)
    );
    try {
      return await this.userService.resetPassword(request);
    } catch (error) {
      if (error instanceof IllegalStateError) {
        throw new HttpException(
          {
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            error: error
          },
          HttpStatus.UNPROCESSABLE_ENTITY
        );
      }
      throw error; // Re-throw other errors
    }
  }

  /**
   * Fetch user interests.
   * @returns A list of user interests.
   */
  @Post('/interests')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Fetch user interests.',
    description: 'Fetch user interests, optionally by id'
  })
  @ApiResponse({ status: 200, description: 'Fetch user interests, optionally by id', type: Array<UserInterests> })
  @ApiBadRequestResponse({ description: 'Unable to fetch user interests' })
  public async fetchUserInterests(@Query() request: FetchUserInterestsRequest): Promise<Array<UserInterests>> {
    const logEventPayload = {};
    this.auditLogsService.createLogEvent(
      this.auditLogsService.getAuditLogParams(
        'default',
        'fetchUserInterests',
        'Fetch user interests',
        'GET'
      ),
      JSON.stringify(logEventPayload)
    );
    try {
      return await this.userService.fetchUserInterests(request);
    } catch (error) {
      if (error instanceof IllegalStateError) {
        throw new HttpException(
          {
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            error: error
          },
          HttpStatus.UNPROCESSABLE_ENTITY
        );
      }
      throw error; // Re-throw other errors
    }
  }


  @Get('/search')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Generic search',
    description: 'Search users, posts, businesses or all of them with weighted full-text indexing and pagination'
  })
  public async search(@CurrentUser() user: any, @Query() query: SearchUsersRequest) {
    return await this.userService.search(query, String(user?._id || user?.sub || ''));
  }




  @Get('/friends/list')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List friends',
    description: 'Returns the authenticated user friends with pagination'
  })
  public async listFriends(@CurrentUser() user: any, @Query() query: FriendRequestsListRequest) {
    return await this.userService.listFriends(String(user?._id || user?.sub || ''), query);
  }

  @Get('/friends/requests/received')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List received friend requests',
    description: 'Returns the authenticated user received friend requests with pagination'
  })
  public async listReceivedFriendRequests(@CurrentUser() user: any, @Query() query: FriendRequestsListRequest) {
    return await this.userService.listReceivedFriendRequests(String(user?._id || user?.sub || ''), query);
  }
  @Post('/friends/action')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Friend workflow action',
    description: 'Single endpoint to send, accept, decline friend requests or remove existing friend'
  })
  public async friendAction(@CurrentUser() user: any, @Body() request: FriendActionRequest) {
    return await this.userService.friendAction(String(user?._id || user?.sub || ''), request);
  }
  @Get('/:userId')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Fetch user info by user id',
    description: 'Get details of another user by user id'
  })
  public async fetchUserInfoById(@CurrentUser() user: any, @Param('userId') userId: string) {
    return await this.userService.fetchUserInfoById(userId, String(user?._id || user?.sub || ''));
  }


}
