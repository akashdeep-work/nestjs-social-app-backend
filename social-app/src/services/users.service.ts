import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { FilterQuery, Model, Types } from 'mongoose';

import { FRIEND_ACTION, MEDIA_TYPE, SEARCH_SCOPE, SERVICE, UserRoles, UserStatus, VerificationTypes } from '../helpers/constants';
import { CustomLoggerService } from './logging/custom-logger.service';
import { IllegalStateError } from '../exceptions/illegal-state.error';
import { UserSubscriptions } from '../helpers/constants';
import { FetchUserInterestsRequest, FriendActionRequest, FriendRequestsListRequest, PasswordResetRequest, SearchUsersRequest, SendPasswordResetCodeRequest, UpdateUserRequest, UserLoginRequest, UserSignupRequest, FetchUserInfoRequest } from '../dto/users-requests';
import { FetchUserInfoResponse, PasswordResetResponse, UserLoginResponse } from '../dto/users-responses';
import { UserRepository } from '../repositories/user.repository';
import { VerificationService } from '../services/verification.service';
import { VerificationCodeResponse } from 'src/dto/verification-responses';
import { VerificationRepository } from 'src/repositories/verification.repository';
import { AnomalyDetectionService } from './anomaly.detector.service';
import { SubscriptionRepository } from 'src/repositories/subscription.repository';
import { ReferralService } from './referral.service';
import { AccountNotVerifiedException, EmailAlreadyExistsException, InvalidCredentialsException, InvalidOtpException, LoginServerErrorException, NonPremiumSignupException, OtpUserNotFoundException, SomethingWentWrongException, UserInfoNotFoundException } from 'src/exceptions/general.error';
import { BaseHttpException } from 'src/exceptions/base-http.exception';
import { NotificationService } from './notification.service';
import { InterestRepository } from 'src/repositories/interest.repository';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from 'src/schemas/user.schema';
import { Post, PostDocument } from 'src/schemas/post.schema';
import { UserInterests } from 'src/dto/user';

@Injectable()
export class UsersService {
  private readonly logger = new CustomLoggerService(SERVICE, UsersService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly verificationService: VerificationService,
    private readonly notificationService: NotificationService,
    private readonly anomalyDetectionService: AnomalyDetectionService,
    private readonly referralService: ReferralService,
    private readonly verificationRepository: VerificationRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly interestRepository: InterestRepository,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>
  ) {}

  private hashData(data: string): number {
    const hash = createHash('sha256').update(data).digest('hex');
    return parseInt(hash.substring(0, 8), 16);
  }

  private maskUserInfo(value: string): string {
    if (!value) return '';
    if (value.length <= 2) return value; // Too short to mask
    return '*'.repeat(value.length - 2) + value.slice(-2);
  }

  async login(request: UserLoginRequest, userAgent: string, ip: string): Promise<UserLoginResponse> {
    try {
      const { code, fcm, deviceId, password, ...handles } = request;

      if(code){
        const { email, phone } = handles;
        const handle = phone || email;
        const verification = await this.verificationService.verifyVerificationCode({
          handle,
          code,
          type: VerificationTypes.LOGIN
        });
        if(!verification?.verified){
          throw new AccountNotVerifiedException();
        }
      }

      const user = await this.userRepository.findAll(handles);

      const loginEvent = {
        userId: String(user[0]?._id),
        ip,
        deviceId,
        userAgent,
        isFailedAttempt: false
      }

      if(!user.length){
        throw new UserInfoNotFoundException();
      }

      loginEvent.isFailedAttempt = !code && user[0].password !== password;
      
      if(fcm){
        this.notificationService.registerDevice({ userId: new Types.ObjectId(String(user[0]._id)), token: fcm, type: 'fcm', primary: false, metadata: { deviceId } })
        .catch(error => {
          this.logger.error(`Error while registering device: ${error.message}`);
        });
      }

      this.anomalyDetectionService.sendSuspiciousLoginAlert(loginEvent)
      .catch(error => {
        this.logger.error(`Error while checking anomaly: ${error.message}`);
      });

      if(loginEvent.isFailedAttempt){
        throw new InvalidCredentialsException();
      }

      const payload = { sub: user[0]._id, email: user[0].email };
      const accessToken = this.userRepository.generateJwt(payload);

      await this.userRepository.update({_id: user[0]._id, token: accessToken, lastLoginAt: new Date()})

      const userInfo = this.userRepository.parseUserInfo(user[0]);
      const result: UserLoginResponse = {
        ...userInfo,
        token: accessToken
      };

      return result;
    } catch (error) {
      // Handle validation or other errors
      const details = 'Error while logging in: ' + error.message;
      this.logger.error(details);
      if (error instanceof BaseHttpException || error instanceof IllegalStateError) {
        throw error;
      }
      throw new SomethingWentWrongException(details);
    }
  }

  async signup(request: UserSignupRequest): Promise<UserLoginResponse> {
    try {
      const { email, phone } = request;

      const [resultByEmail, phoneVerification] = await Promise.all([
        this.userRepository.findAll({ email }),
        this.verificationService.getVerificationStatus({ handle: phone, type: VerificationTypes.SIGNUP })
      ]);

      // Check if email exists
      if(resultByEmail.length){
        throw new EmailAlreadyExistsException();
      }

      // Check if phone number is verified
      if(!phoneVerification?.verified){
        throw new AccountNotVerifiedException();
      }

      const resultByPhone = await this.userRepository.findAll({ phone });
      // If email exists, check if the registered phone number is linked with any premium plan.
      const premiumAccounts = resultByPhone.filter(r => r.subscription?.name !== UserSubscriptions.BASIC);
      if(resultByPhone?.length && !premiumAccounts.length){
        throw new NonPremiumSignupException();
      }

      let subscriptionToActivate = UserSubscriptions.BASIC;

      if(request.referral){
        const referralStatus = await this.referralService.validateReferralCode(request.referral, email);

        if(referralStatus.valid){
          subscriptionToActivate = UserSubscriptions[referralStatus.offers.toString()];
        }
      }

      const [subscription] = await this.subscriptionRepository.findAll({name: subscriptionToActivate});

      request.subscription = {
        id: new Types.ObjectId(String(subscription._id)) as any,
        name: subscription.name,
        type: subscription.type,
        validity: subscription.validity,
        active: true,
        expiresAt: new Date(new Date().setMonth(new Date().getMonth() + Math.floor(subscription.validity/30)))
      }

      request.status = UserStatus.VERIFIED;

      const insertCount = await this.userRepository.bulkInsert([request]);
      if(!insertCount){
        throw new SomethingWentWrongException();
      }

      if(request.referral){
        await this.referralService.updateReferralCodeStatus(request.referral, true);
      }

      const user = await this.userRepository.findAll({ email });
      
      const payload = { sub: user[0]._id, email: user[0].email };
      const accessToken = this.userRepository.generateJwt(payload);

      await this.userRepository.update({_id: user[0]._id, token: accessToken});

      const { fcm, deviceId } = request;

      if(fcm){
        this.notificationService.registerDevice({ userId: new Types.ObjectId(String(user[0]._id)), token: fcm, type: 'fcm', primary: true, metadata: { deviceId } })
        .catch(error => {
          this.logger.error(`Error while registering device: ${error.message}`);
        });
      }
      
      const userInfo = this.userRepository.parseUserInfo(user[0]);
      const result: UserLoginResponse = {
        ...userInfo,
        token: accessToken
      };

      return result;
    } catch (error) {
      // Handle validation or other errors
      const details = 'Error while signing up: ' + error.message;
      this.logger.error(details);
      if (error instanceof BaseHttpException || error instanceof IllegalStateError) {
        throw error;
      }
      throw new SomethingWentWrongException(details);
    }
  }

  async fetchUserInfo(request: FetchUserInfoRequest, currentUser?: any): Promise<FetchUserInfoResponse> {
    try {
      const user = await this.userRepository.findAll(request);

      const accounts = user.map(u => {
        const { username, email, phone, picture, provider, fullname, bio, status, subscription } = u;
        const splitEmail = email.split('@');

        return {
          username: currentUser ? username : this.maskUserInfo(username),
          email: currentUser ? email : this.maskUserInfo(splitEmail[0]).concat('@').concat(splitEmail[1]),
          phone: currentUser ? phone : this.maskUserInfo(phone),
          picture,
          provider,
          fullname: currentUser ? fullname : this.maskUserInfo(fullname),
          status,
          bio,
          subscription: {
            name: currentUser ? subscription?.['name'] : UserSubscriptions.BASIC,
            validity: currentUser ? subscription?.['validity'] : 0,
            type: currentUser ? subscription?.['type'] : '',
            active: currentUser ? subscription?.['active'] : false,
            expiresAt: currentUser ? subscription?.['expiresAt'] : new Date()
          }
        }
      })

      return { accounts };
    } catch (error) {
      // Handle validation or other errors
      const details = 'Error while fetching user: ' + error.message;
      this.logger.error(details);
      if (error instanceof BaseHttpException || error instanceof IllegalStateError) {
        throw error;
      }
      throw new SomethingWentWrongException(details);
    }
  }


  async fetchUserInfoById(userId: string, currentUserId?: string) {
    const targetUser = await this.userModel
      .findById(userId, {
        fullname: 1,
        username: 1,
        email: 1,
        phone: 1,
        picture: 1,
        bio: 1,
        status: 1,
        subscription: 1,
        friends: 1
      })
      .lean<any>();

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const currentUser = currentUserId
      ? await this.userModel.findById(currentUserId, { friends: 1 }).lean<any>()
      : null;

    const currentUserFriendIds = new Set(((currentUser?.friends ?? []) as any[]).map((id: any) => String(id)));

    return {
      _id: targetUser._id,
      fullname: targetUser.fullname,
      username: targetUser.username ?? '',
      email: targetUser.email,
      phone: targetUser.phone,
      picture: targetUser.picture,
      bio: targetUser.bio,
      status: targetUser.status,
      subscription: targetUser.subscription,
      isFriend: currentUserFriendIds.has(String(targetUser._id))
    };
  }

  async updateUserInfo(userId: string, request: UpdateUserRequest): Promise<UserLoginResponse> {
    try {
      const _id = new Types.ObjectId(String(userId));

      const userInfo = await this.userRepository.findAll({ _id });
      if(!userInfo?.length){
        throw new UserInfoNotFoundException();
      }

      const { interests, ...fieldsToUpdate  } = request;
      if(interests){
        if(interests.length){
          const interestDetails = await this.interestRepository.findAll({ _id: interests });
          fieldsToUpdate['interests'] = interestDetails.map(i => i._id);
        }
        else{
          fieldsToUpdate['interests'] = [];
        }
      }
      const updateCondition = { _id: _id as any, ...fieldsToUpdate };
      const [ user ] = await this.userRepository.update(updateCondition);

      const updatedUserInfo = this.userRepository.parseUserInfo(user);
      const result: UserLoginResponse = {
        ...updatedUserInfo,
        token: user?.token
      };

      return result;
    } catch (error) {
      // Handle validation or other errors
      const details = 'Error while updating user: ' + error.message;
      this.logger.error(details);
      if (error instanceof BaseHttpException || error instanceof IllegalStateError) {
        throw error;
      }
      throw new SomethingWentWrongException(details);
    }
  }

  async sendPasswordResetCode(request: SendPasswordResetCodeRequest): Promise<VerificationCodeResponse> {
    try {
      const handle = request.email;

      const [ user ] = await this.userRepository.findAll({ email: handle });
      if(!user){
        throw new OtpUserNotFoundException();
      }

      const result = await this.verificationService.sendVerificationCode({ handle, type: VerificationTypes.RESET_PASSWORD });

      return result;
    } catch (error) {
      // Handle validation or other errors
      const details = 'Error while sending password reset code: ' + error.message;
      this.logger.error(details);
      if (error instanceof BaseHttpException || error instanceof IllegalStateError) {
        throw error;
      }
      throw new SomethingWentWrongException(details);
    }
  }

  async resetPassword(request: PasswordResetRequest): Promise<PasswordResetResponse> {
    try {
      const { email, password } = request;

      const [ verification ] = await this.verificationRepository.findAll({
        handle: email,
        type: VerificationTypes.RESET_PASSWORD,
        verified: true
      });

      if(!verification){
        throw new InvalidOtpException();
      }

      if(verification?.expiresAt){
        const codeExpiryDateTime = new Date(verification.expiresAt);
        const currentDateTime = new Date();

        if(currentDateTime > codeExpiryDateTime){
          throw new InvalidOtpException();
        }
      }

      const [ user ] = await this.userRepository.findAll({ email });
      if(!user){
        throw new OtpUserNotFoundException()
      }

      await this.userRepository.update({ _id: user._id, password });

      return { success: true };
    } catch (error) {
      // Handle validation or other errors
      const details = 'Error while resetting password: ' + error.message;
      this.logger.error(details);
      if (error instanceof BaseHttpException || error instanceof IllegalStateError) {
        throw error;
      }
      throw new SomethingWentWrongException(details);
    }
  }

  async fetchUserInterests(request: FetchUserInterestsRequest): Promise<Array<UserInterests>> {
    try {
      const { id, name } = request;

      const findCondition = {
        ...(id ? { _id: id.split(',').map(i => new Types.ObjectId(i.trim())) } : {}),
        ...(name ? { name: name.split(',').map(n => n.trim()) } : {})
      }

      const interests = await this.interestRepository.findAll(findCondition);

      return interests.map(i => ({ id: String(i._id), name: i.name }));
    } catch (error) {
      // Handle validation or other errors
      const details = 'Error while fetching user interests: ' + error.message;
      this.logger.error(details);
      if (error instanceof BaseHttpException || error instanceof IllegalStateError) {
        throw error;
      }
      throw new SomethingWentWrongException(details);
    }
  }

  private getBusinessFilter(userIdToSkip?: string): FilterQuery<UserDocument> {
    const filter: FilterQuery<UserDocument> = {
      $or: [
        { userType: UserRoles.BUSINESS },
        { accountType: UserRoles.BUSINESS },
        { type: UserRoles.BUSINESS },
        { role: UserRoles.BUSINESS }
      ]
    };

    if (userIdToSkip) {
      filter._id = { $ne: new Types.ObjectId(userIdToSkip) } as any;
    }

    return filter;
  }

  async search(request: SearchUsersRequest, currentUserId?: string) {
    const q = request.query?.trim();
    if (!q) {
      throw new BadRequestException('query is required');
    }

    const scope = request.scope ?? SEARCH_SCOPE.ALL;
    const page = request.page ?? 1;
    const limit = request.limit ?? 20;
    const skip = (page - 1) * limit;
    const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const qRegex = new RegExp(escapedQuery, 'i');

    const result: any = {
      query: q,
      scope,
      page,
      limit
    };

    if (scope === SEARCH_SCOPE.USERS || scope === SEARCH_SCOPE.ALL) {
      const usersFilter: FilterQuery<UserDocument> = {
        $or: [
          { fullname: qRegex },
          { username: qRegex },
          { email: qRegex }
        ]
      };

      const [items, total, currentUser] = await Promise.all([
        this.userModel
          .find(usersFilter, { fullname: 1, username: 1, email: 1, picture: 1, bio: 1 })
          .sort({ fullname: 1, username: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        this.userModel.countDocuments(usersFilter),
        currentUserId
          ? this.userModel.findById(currentUserId, { friends: 1 }).lean<any>()
          : Promise.resolve(null)
      ]);

      const currentUserFriendIds = new Set(
        ((currentUser as any)?.friends ?? []).map((id: any) => String(id))
      );

      result.users = {
        items: items.map((item: any) => ({
          ...item,
          isFriend: currentUserFriendIds.has(String(item?._id))
        })),
        total,
        totalPages: Math.ceil(total / limit)
      };
    }

    if (scope === SEARCH_SCOPE.POSTS || scope === SEARCH_SCOPE.ALL) {
      const postsFilter: FilterQuery<PostDocument> = {
        deletedAt: { $exists: false },
        content: qRegex
      };

      const [items, total] = await Promise.all([
        this.postModel
          .find(postsFilter, { content: 1, media: 1, mediaUrls: 1, authorId: 1, createdAt: 1 })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        this.postModel.countDocuments(postsFilter)
      ]);

      result.posts = {
        items: items.map((item: any) => {
          const media = item?.media?.length
            ? item.media
            : (item?.mediaUrls ?? []).map((url: string) => ({ url, type: MEDIA_TYPE.IMAGE }));

          return {
            ...item,
            media,
            mediaUrls: media.map((m: any) => m.url)
          };
        }),
        total,
        totalPages: Math.ceil(total / limit)
      };
    }

    if (scope === SEARCH_SCOPE.BUSINESSES || scope === SEARCH_SCOPE.ALL) {
      const businessFilter: FilterQuery<UserDocument> = {
        ...this.getBusinessFilter(),
        $or: [
          { fullname: qRegex },
          { username: qRegex },
          { email: qRegex }
        ]
      };

      const [items, total] = await Promise.all([
        this.userModel
          .find(businessFilter, { fullname: 1, username: 1, email: 1, picture: 1, bio: 1 })
          .sort({ fullname: 1, username: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        this.userModel.countDocuments(businessFilter)
      ]);

      result.businesses = {
        items,
        total,
        totalPages: Math.ceil(total / limit)
      };
    }

    return result;
  }




  async listFriends(currentUserId: string, query: FriendRequestsListRequest) {
    const user = await this.userModel
      .findById(currentUserId, { friends: 1 })
      .lean<any>();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const friendIds = (user.friends ?? []).map((id: any) => new Types.ObjectId(String(id)));

    if (!friendIds.length) {
      return {
        items: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      };
    }

    const [items, total] = await Promise.all([
      this.userModel
        .find(
          { _id: { $in: friendIds } },
          { fullname: 1, username: 1, email: 1, picture: 1, bio: 1, createdAt: 1 }
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.userModel.countDocuments({ _id: { $in: friendIds } })
    ]);

    return {
      items: items.map((item: any) => ({
        ...item,
        username: item?.username ?? ''
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async listReceivedFriendRequests(currentUserId: string, query: FriendRequestsListRequest) {
    const user = await this.userModel
      .findById(currentUserId, { friendRequestsReceived: 1 })
      .lean<any>();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const incomingIds = (user.friendRequestsReceived ?? []).map((id: any) => new Types.ObjectId(String(id)));

    if (!incomingIds.length) {
      return {
        items: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      };
    }

    const [items, total] = await Promise.all([
      this.userModel
        .find(
          { _id: { $in: incomingIds } },
          { fullname: 1, username: 1, email: 1, picture: 1, bio: 1, createdAt: 1 }
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.userModel.countDocuments({ _id: { $in: incomingIds } })
    ]);

    const normalizedItems = items.map((item: any) => ({
      ...item,
      username: item?.username ?? ''
    }));

    return {
      items: normalizedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  async friendAction(currentUserId: string, request: FriendActionRequest) {
    const targetUserId = request.userId;
    if (currentUserId === targetUserId) {
      throw new BadRequestException('You cannot perform friend action with yourself');
    }

    const currentUserObjectId = new Types.ObjectId(currentUserId);
    const targetUserObjectId = new Types.ObjectId(targetUserId);

    const [currentUser, targetUser] = await Promise.all([
      this.userModel.findById(currentUserObjectId, {
        fullname: 1,
        friends: 1,
        friendRequestsSent: 1,
        friendRequestsReceived: 1
      }).lean<any>(),
      this.userModel.findById(targetUserObjectId, {
        friends: 1,
        friendRequestsSent: 1,
        friendRequestsReceived: 1
      }).lean<any>()
    ]);

    if (!currentUser || !targetUser) {
      throw new NotFoundException('User not found');
    }

    const currentFriends = ((currentUser as any).friends ?? []).map((id: any) => id.toString());
    const targetFriends = ((targetUser as any).friends ?? []).map((id: any) => id.toString());
    const currentOutgoing = ((currentUser as any).friendRequestsSent ?? []).map((id: any) => id.toString());
    const currentIncoming = ((currentUser as any).friendRequestsReceived ?? []).map((id: any) => id.toString());
    const targetOutgoing = ((targetUser as any).friendRequestsSent ?? []).map((id: any) => id.toString());
    const targetIncoming = ((targetUser as any).friendRequestsReceived ?? []).map((id: any) => id.toString());

    if (request.action === FRIEND_ACTION.SEND_REQUEST) {
      if (currentFriends.includes(targetUserId)) {
        throw new BadRequestException('Users are already friends');
      }

      if (currentOutgoing.includes(targetUserId)) {
        return { ok: true, status: 'request_already_sent' };
      }

      await Promise.all([
        this.userModel.updateOne(
          { _id: currentUserObjectId },
          { $addToSet: { friendRequestsSent: targetUserObjectId } }
        ),
        this.userModel.updateOne(
          { _id: targetUserObjectId },
          { $addToSet: { friendRequestsReceived: currentUserObjectId } }
        )
      ]);

      this.notificationService.dispatchNotification({
        userId: new Types.ObjectId(targetUserId),
        title: 'New Friend Request',
        body: `${currentUser.fullname ?? 'Someone'} sent you a friend request`,
        data: { action: FRIEND_ACTION.SEND_REQUEST, fromUserId: currentUserId }
      }).catch(error => this.logger.error(`Error while sending friend request notification: ${error.message}`));

      return { ok: true, status: 'request_sent' };
    }

    if (request.action === FRIEND_ACTION.ACCEPT_REQUEST) {
      if (!currentIncoming.includes(targetUserId) && !targetOutgoing.includes(currentUserId)) {
        throw new BadRequestException('No pending friend request from this user');
      }

      await Promise.all([
        this.userModel.updateOne(
          { _id: currentUserObjectId },
          {
            $pull: { friendRequestsReceived: targetUserObjectId },
            $addToSet: { friends: targetUserObjectId }
          }
        ),
        this.userModel.updateOne(
          { _id: targetUserObjectId },
          {
            $pull: { friendRequestsSent: currentUserObjectId },
            $addToSet: { friends: currentUserObjectId }
          }
        )
      ]);
      return { ok: true, status: 'request_accepted' };
    }

    if (request.action === FRIEND_ACTION.DECLINE_REQUEST) {
      await Promise.all([
        this.userModel.updateOne(
          { _id: currentUserObjectId },
          { $pull: { friendRequestsReceived: targetUserObjectId } }
        ),
        this.userModel.updateOne(
          { _id: targetUserObjectId },
          { $pull: { friendRequestsSent: currentUserObjectId } }
        )
      ]);
      return { ok: true, status: 'request_declined' };
    }

    if (request.action === FRIEND_ACTION.REMOVE_FRIEND) {
      await Promise.all([
        this.userModel.updateOne(
          { _id: currentUserObjectId },
          { $pull: { friends: targetUserObjectId } }
        ),
        this.userModel.updateOne(
          { _id: targetUserObjectId },
          { $pull: { friends: currentUserObjectId } }
        )
      ]);
      return { ok: true, status: 'friend_removed' };
    }

    throw new BadRequestException('Invalid friend action');
  }


}
