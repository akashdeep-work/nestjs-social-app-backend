import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { AuditLogsService } from './services/logging/audit-logs.service';
import { CustomLoggerService } from './services/logging/custom-logger.service';
import { Helper } from './helpers/helper';
import { MainController } from './main.controller';
import { User, UserSchema } from './schemas/user.schema';
import { ScheduleModule } from '@nestjs/schedule';
import { UserController } from './users.controller';
import { UsersService } from './services/users.service';
import { UserRepository } from './repositories/user.repository';
import { AzureBlobFileStorageService } from './services/file-storage/azure-blob-file-storage.service'
import { Subscription, SubscriptionSchema } from './schemas/subscription.schema';
import { Verification, VerificationSchema } from './schemas/verification.schema';
import { SubscriptionController } from './subscription.controller';
import { VerificationController } from './verification.controller';
import { SubscriptionService } from './services/subscription.service';
import { VerificationService } from './services/verification.service';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { VerificationRepository } from './repositories/verification.repository';
import { AuthModule } from './auth.module';
import { AnomalyDetectionService } from './services/anomaly.detector.service';
import { Role, RoleSchema } from './schemas/role.schema';
import { Permission, PermissionSchema } from './schemas/permission.schema';
import { HIBPController } from './hibp.controller';
import { HIBPService } from './services/hibp.service';
import { TwilioService } from './services/twilio.service';
import { DocumentController } from './document.controller';
import { Referral, ReferralSchema } from './schemas/referral.schema';
import { ReferralRepository } from './repositories/referral.repository';
import { ReferralController } from './referral.controller';
import { ReferralService } from './services/referral.service';
import { GeoService } from './services/geo.service';
import { NotificationService } from './services/notification.service';
import { Interest, InterestSchema } from './schemas/interest.schema';
import { InterestRepository } from './repositories/interest.repository';
import { ChatMessage, ChatMessageSchema } from './schemas/chat-message.schema';
import { Post as SocialPost, PostSchema } from './schemas/post.schema';

import { ChatGroup, ChatGroupSchema } from './schemas/chat-group.schema';
import { ChatUserSettings, ChatUserSettingsSchema } from './schemas/chat-user-settings.schema';
import { ChatService } from './services/chat.service';
import { ChatController } from './chat.controller';
import { SocialController } from './social.controller';

import { SocketAuthService } from './services/socket-auth.service';
import { RealtimePresenceService } from './services/realtime-presence.service';
import { RealtimeGateway } from './realtime/realtime.gateway';
import { RealtimeService } from './realtime/realtime.service';
import { SocialService } from './services/social.service';
import { WsJwtMiddleware } from './middlewares/ws-jwt.middleware';

//TODO: Separate "fat" module into multiple modules (should check best practices first!)
@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    HttpModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const dbServers = configService.get<string>('DB_SERVERS');
        let uri = configService.get<string>('MONGO_DSN');
        if (dbServers) {
          // build uri based on ENV
          const dbUser = configService.get<string>('DB_USER');
          const dbPass = configService.get<string>('DB_PASSWORD');
          const dbReplicaSet = configService.get<string>('DB_REPLICA_SET');
          const replicaSetParameter = dbReplicaSet ? `replicaSet=${dbReplicaSet}` : 'directConnection=true';
          uri = `mongodb://${dbUser}:${dbPass}@${dbServers}/social-app-backend?authSource=admin&${replicaSetParameter}`;
        }

        return {
          uri,
          useNewUrlParser: true,
          useUnifiedTopology: true
        };
      },
      inject: [ConfigService]
    }),
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
        collection: 'users'
      },
      {
        name: Subscription.name,
        schema: SubscriptionSchema,
        collection: 'subscriptions'
      },
      {
        name: Verification.name,
        schema: VerificationSchema,
        collection: 'verifications'
      },
      {
        name: Role.name,
        schema: RoleSchema,
        collection: 'roles'
      },
      {
        name: Permission.name,
        schema: PermissionSchema,
        collection: 'permissions'
      },
      {
        name: Referral.name,
        schema: ReferralSchema,
        collection: 'referrals'
      },
      {
        name: Interest.name,
        schema: InterestSchema,
        collection: 'interests'
      },
      {
        name: ChatMessage.name,
        schema: ChatMessageSchema,
        collection: 'chat_messages'
      },
      {
        name: SocialPost.name,
        schema: PostSchema,
        collection: 'posts'
      },

      {
        name: ChatGroup.name,
        schema: ChatGroupSchema,
        collection: 'chat_groups'
      },
      {
        name: ChatUserSettings.name,
        schema: ChatUserSettingsSchema,
        collection: 'chat_user_settings'
      },

    ])
  ],
  controllers: [
    ChatController,
    SocialController,
    DocumentController,
    ReferralController,
    HIBPController,
    MainController,
    SubscriptionController,
    UserController,
    VerificationController
  ],
  providers: [
    Helper,
    AnomalyDetectionService,
    AuditLogsService,
    CustomLoggerService,
    ReferralService,
    GeoService,
    HIBPService,
    NotificationService,
    SubscriptionService,
    TwilioService,
    UsersService,
    VerificationService,
    SubscriptionRepository,
    UserRepository,
    VerificationRepository,
    ReferralRepository,
    InterestRepository,
    ChatService,
    RealtimeGateway,
    RealtimeService,
    SocketAuthService,
    WsJwtMiddleware,
    RealtimePresenceService,
    SocialService,
  ],
  exports: []
})
export class SocialAppModule {}
