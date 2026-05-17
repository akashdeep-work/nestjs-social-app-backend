import { Document, ObjectId, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { LoginProviders, UserStatus } from 'src/helpers/constants';
import { Address } from 'src/dto/address';
import { SubscriptionDocument } from './subscription.schema';
import { RoleDocument } from './role.schema';
import { InterestDocument } from './interest.schema';
import { Subscription } from 'src/dto/subscription';
import { EducationDetails, JobDetails, PersonalDetails, UserPreferences } from 'src/dto/user';

// Define the type for a User Document
export type UserDocument = User & Document<ObjectId>;

// Define the schema for the User model
@Schema({ strict: false })
export class User {
  // Username of the user
  @Prop({ required: false, type: String })
  username?: string;
  
  // Email of the user.
  @Prop({ required: false, type: String })
  email?: string;
  
  // Phone number of the user.
  @Prop({ required: false, type: String })
  phone?: string;
  
  // Encrypted password of the user.
  @Prop({ required: false, type: String })
  password?: string;
  
  // Fullname of the user.
  @Prop({ required: true, type: String })
  fullname: string;
  
  // Roles of the user.
  @Prop({ required: true, type: [Types.ObjectId], ref: 'Role' })
  roles: Array<string | RoleDocument>;
  
  // Date of birth of the user in DD/MM/YYYY format.
  @Prop({ required: true, type: String })
  dob: string;
  
  // Gender of the user.
  @Prop({ required: true, type: String })
  gender: string;

  // Bio of the user.
  @Prop({ required: false, type: String })
  bio?: string;

  // Profile picture url of the user.
  @Prop({ required: false, type: String })
  picture?: string;

  // Cover image
  @Prop({ required: false, type: String })
  cover?: string;

  // User images
  @Prop({ required: false, type: [String] })
  gallery?: Array<string>;
  
  // Education details
  @Prop({ required: false, type: Object })
  education?: EducationDetails;
  
  // Job details
  @Prop({ required: false, type: Object })
  job?: JobDetails;
  
  // Personal details
  @Prop({ required: false, type: Object })
  personals?: PersonalDetails;

  // User Pereferences
  @Prop({ required: false, type: Object })
  preferences?: UserPreferences;
  
  // Primary language
  @Prop({ required: false, type: String })
  primaryLanguage?: string;
  
  // Other languages.
  @Prop({ required: false, type: [String] })
  otherLanguages?: Array<string>

  // Interests of the user.
  @Prop({ required: false, type: [Types.ObjectId], ref: 'Interest' })
  interests?: Array<string | InterestDocument>;

  // Login provider.
  @Prop({ required: false, type: String })
  provider?: LoginProviders = LoginProviders.SOCIAL_APP;
  
  // Status of the user.
  @Prop({ required: true, type: String })
  status: UserStatus;
  
  // Full address of the user.
  @Prop({ required: false, type: Object })
  address?: Address;

  // Subscription of the user.
  @Prop({ required: true, type: Object })
  subscription: Subscription;

  // Access token of the user.
  @Prop({ required: true, type: String })
  token: string;

  // Date of the user creation.
  @Prop({ required: true, type: Date })
  createdAt: Date;

  // Date of the user last update.
  @Prop({ required: false, type: Date })
  updatedAt?: Date;

  // Last login of user.
  @Prop({ required: false, type: Date })
  lastLoginAt?: Date;
}

// Create a User Schema using SchemaFactory and index it by the 'id' property
export const UserSchema = SchemaFactory.createForClass(User)
  .index({ email: 1 })
  .index({ phone: 1 })
  .index({ username: 1 })
  .index({ createdAt: 1 })
  .index({ userType: 1, accountType: 1, type: 1 })
  .index(
    { fullname: 'text', username: 'text', email: 'text', bio: 'text' },
    {
      name: 'user_search_text_idx',
      weights: { fullname: 10, username: 7, email: 5, bio: 2 },
      default_language: 'english'
    }
  );

export type UpdateUserDocument = Partial<UserDocument>;
