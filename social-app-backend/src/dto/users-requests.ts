import {
  IsArray,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MinLength,
  Min,
  Validate,
  ValidateNested,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { EducationDetails, JobDetails, PersonalDetails, User, UserPreferences } from './user'
import { Transform, Type } from 'class-transformer';
import { Address } from './address';
import { ObjectId, Types } from 'mongoose';
import { FRIEND_ACTION, FriendAction, SEARCH_SCOPE, SearchScope } from 'src/helpers/constants';

@ValidatorConstraint({ name: 'ValidLoginCombination', async: false })
class ValidLoginCombinationConstraint implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments) {
    const { username, email, phone, password, code } = args.object as any;

    const identifiers = [username, email, phone].filter(Boolean);
    const hasOneIdentifier = identifiers.length === 1;

    const hasPassword = !!password;
    const hasCode = !!code;

    // Case 1: exactly one identifier + password
    const isPasswordLogin = hasOneIdentifier && hasPassword && !hasCode;

    // Case 2: exactly one of email or phone + code
    const isCodeLogin = hasCode && !hasPassword && ['email', 'phone'].filter(k => !!args.object[k]).length === 1;

    return isPasswordLogin || isCodeLogin;
  }

  defaultMessage(_: ValidationArguments) {
    return 'Invalid login request: provide only one of (username/email/phone + password) OR (email/phone + code). Do not mix credentials.';
  }
}

/**
 * Data Transfer Object (DTO) for login.
 */
export class UserLoginRequest {
  /**
   * Username of the user.
   */
  @ApiProperty({
    description: 'Username of the user.',
    type: String,
    example: 'johndoe3579',
    required: false
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.toLowerCase().trim())
  username?: string;

  /**
   * Email of the user.
   */
  @ApiProperty({
    description: 'Email of the user.',
    type: String,
    example: 'user@social-app.com',
    required: false
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  /**
   * Phone number of the user.
   */
  @ApiProperty({
    description: 'Phone number of the user.',
    type: String,
    example: '+916724851987',
    required: false
  })
  @IsString()
  @IsOptional()
  phone?: string;

  /**
   * Encrypted password for the account.
   */
  @ApiProperty({
    description: 'Encrypted password for the account.',
    type: String,
    example: '2uygr6irg9urh2iurgbrfn3nk',
    required: false
  })
  @IsString()
  @IsOptional()
  password?: string;

  /**
   * Verification code.
   */
  @ApiProperty({
    description: 'Verification code.',
    type: String,
    example: '123456',
    required: false
  })
  @IsString()
  @IsOptional()
  code?: string;

  /**
   * Device Id.
   */
  @ApiProperty({
    description: 'Device Id.',
    type: String,
    example: 'device-01',
    required: false
  })
  @IsString()
  @IsOptional()
  deviceId?: string;

  /**
   * FCM token.
   */
  @ApiProperty({
    description: 'FCM token.',
    type: String,
    example: 'fcm token',
    required: false
  })
  @IsString()
  @IsOptional()
  fcm?: string;

  @Validate(ValidLoginCombinationConstraint)
  private readonly _loginCombo!: unknown;
}

/**
 * Data Transfer Object (DTO) for email signup.
 */
export class UserSignupRequest extends User {
  /**
   * Email of the user.
   */
  @ApiProperty({
    description: 'Email of the user.',
    type: String,
    example: 'user@social-app.com',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  /**
   * Phone number of the user.
   */
  @ApiProperty({
    description: 'Phone number of the user.',
    type: String,
    example: '+916724851987',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  /**
   * Referral code.
   */
  @ApiProperty({
    description: 'Referral code.',
    type: String,
    example: 'EZ65AB12YZ',
    required: false
  })
  @IsString()
  @IsOptional()
  referral?: string;

  /**
   * Device Id.
   */
  @ApiProperty({
    description: 'Device Id..',
    type: String,
    example: 'device-01',
    required: false
  })
  @IsString()
  @IsOptional()
  deviceId?: string;

  /**
   * FCM token.
   */
  @ApiProperty({
    description: 'FCM token.',
    type: String,
    example: 'fcm token',
    required: false
  })
  @IsString()
  @IsOptional()
  fcm?: string;
}

@ValidatorConstraint({ name: 'AtLeastOneContact', async: false })
class AtLeastOneContactConstraint implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments) {
    const { email, phone } = args.object as any;
    return !!(email || phone);
  }

  defaultMessage(_: ValidationArguments) {
    return 'Either email or phone must be provided';
  }
}

@ValidatorConstraint({ name: 'AtLeastOneUpdateInfo', async: false })
class AtLeastOneUpdateInfoConstraint implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments) {
    const { fullname, dob, bio, address, picture, cover, gallery, education, job, personals, preferences, primaryLanguage, otherLanguages, interests } = args.object as any;
    return !!(fullname || dob || bio || address || picture || cover || gallery || education || job || personals || preferences || primaryLanguage || otherLanguages || interests);
  }

  defaultMessage(_: ValidationArguments) {
    return 'fullname, dob, bio, address, picture, cover, gallery, education, job, personals, preferences, primaryLanguage, otherLanguages or interests must be provided';
  }
}

/**
 * Data Transfer Object (DTO) for checking if user exists.
 */
export class FetchUserInfoRequest {
  /**
   * Email of the user.
   */
  @ApiProperty({
    description: 'Email of the user.',
    type: String,
    example: 'user@social-app.com',
    required: false
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  /**
  * Phone number of the user.
   */
  @ApiProperty({
    description: 'Phone number of the user.',
    type: String,
    example: '+916724851987',
    required: false
  })
  @IsString()
  @IsOptional()
  phone?: string;

  // Class-level validation to ensure at least one field is present
  @Validate(AtLeastOneContactConstraint)
  private readonly _atLeastOne!: unknown;
}

/**
 * Data Transfer Object (DTO) for email signup.
 */
export class UpdateUserRequest {
  /**
   * Fullname of the user.
   */
  @ApiProperty({
    description: 'Fullname of the user.',
    type: String,
    example: 'John Doe',
    required: false
  })
  @IsString()
  @IsOptional()
  fullname?: string;
  
  /**
   * Date of birth of the user in DD/MM/YYYY format.
   */
  @ApiProperty({
    description: 'Date of birth of the user in DD/MM/YYYY format.',
    type: String,
    example: '09/09/1999',
    required: false
  })
  @IsString()
  @IsOptional()
  dob?: string;

  /**
   * Bio of the user.
   */
  @ApiProperty({
    description: 'Bio of the user.',
    type: String,
    example: 'About user',
    required: false
  })
  @IsString()
  @IsOptional()
  bio?: string;

  /**
   * Profile image url.
   */
  @ApiProperty({
    description: 'Profile image url.',
    type: String,
    example: 'https://abc.com/xyz.jpg',
    required: false
  })
  @IsString()
  @IsOptional()
  picture?: string;

  /**
   * Cover image url.
   */
  @ApiProperty({
    description: 'Cover image url.',
    type: String,
    example: 'https://abc.com/xyz.jpg',
    required: false
  })
  @IsString()
  @IsOptional()
  cover?: string;

  /**
   * User images url.
   */
  @ApiProperty({
    description: 'User images url.',
    type: Array<String>,
    example: '["https://abc.com/xyz.jpg","https://abc.com/xyz2.jpg"]',
    required: false
  })
  @IsArray()
  @IsOptional()
  gallery?: Array<string> //(multi-select or chips)
  
  /**
   * Education details.
   */
  @ApiProperty({
    description: 'Education details',
    type: EducationDetails,
    example: '{"title": "Bachelor", "field": "Science"}',
    required: false
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => EducationDetails)
  education?: EducationDetails;
  
  /**
   * Job Details.
   */
  @ApiProperty({
    description: 'Job Details.',
    type: JobDetails,
    example: '{"title": "SDE", "industry": "IT"}',
    required: false
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => JobDetails)
  job?: JobDetails;
  
  /**
   * Personal details.
   */
  @ApiProperty({
    description: 'Personal details.',
    type: PersonalDetails,
    example: '{"relationship": "Single", "haveKids": false, "kids": 0}',
    required: false
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => PersonalDetails)
  personals?: PersonalDetails;

  /**
   * User Preferences.
   */
  @ApiProperty({
    description: 'User Preferences.',
    type: UserPreferences,
    example: '{"age": {"from": 18, "to": 30}, "height": {"from": 170, "to": 180}, "eyeColor": "Green", "hairColor": "Blonde"}',
    required: false
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => UserPreferences)
  preferences?: UserPreferences;
  
  /**
   * Primary language.
   */
  @ApiProperty({
    description: 'Primary language.',
    type: String,
    example: 'English',
    required: false
  })
  @IsString()
  @IsOptional()
  primaryLanguage?: string;
  
  /**
   * Other languages.
   */
  @ApiProperty({
    description: 'Other languages.',
    type: Array<String>,
    example: '["English","French"]',
    required: false
  })
  @IsArray()
  @IsOptional()
  otherLanguages?: Array<string> //(multi-select or chips)
  
  /**
   * Interests.
   */
  @ApiProperty({
    description: 'Interests.',
    type: Array<Types.ObjectId>,
    example: '["692d8b006e1386329880a597","692d8b006e1386329880a598"]',
    required: false
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  interests?: Array<Types.ObjectId> //(multi-select or chips)
  
  /**
   * Full address of the user.
   */
  @ApiProperty({
    description: 'Full address of the user.',
    type: Address,
    example: '{"address": "N123 Malibu Point", "city": "Las Vegas", "state": "Nevada", "zip": "89030", "country": "United States", "geolocation": {"latitude": 30.573876, "longitude": 76.7767358}}',
    required: false
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => Address)
  address?: Address;

  // Class-level validation to ensure at least one field is present
  @Validate(AtLeastOneUpdateInfoConstraint)
  private readonly _atLeastOneUpdate!: unknown;
}

/**
 * Data Transfer Object (DTO) for send password reset code request.
 */
export class SendPasswordResetCodeRequest {
  /**
   * Email of the user.
   */
  @ApiProperty({
    description: 'Email of the user.',
    type: String,
    example: 'user@social-app.com'
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;
}

/**
 * Data Transfer Object (DTO) for reset password request.
 */
export class PasswordResetRequest extends SendPasswordResetCodeRequest {
  /**
   * New password encrypted.
   */
  @ApiProperty({
    description: 'New password encrypted.',
    type: String,
    example: 'wn23tr289f928y3biojh9'
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

/**
 * Data Transfer Object (DTO) for fetch user interests request.
 */
export class FetchUserInterestsRequest {
  /**
   * Interest Ids, comma separated.
   */
  @ApiProperty({
    description: 'Interest Ids, comma separated.',
    type: String,
    example: '67853616abf87a4196fe226e,67853616abf87a4196fe226f',
    required: false
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.toLowerCase().trim())
  id?: string;

  /**
   * Interest names, comma separated.
   */
  @ApiProperty({
    description: 'Interest names, comma separated.',
    type: String,
    example: 'Photography,Athletics',
    required: false
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.toLowerCase().trim())
  name?: string;
}

export class SearchUsersRequest {
  @ApiProperty({
    description: 'Search query for users.',
    type: String,
    example: 'john'
  })
  @IsString()
  @MinLength(1)
  query: string;

  @ApiProperty({
    description: 'Search target. Use all to search users, posts and businesses together.',
    enum: Object.values(SEARCH_SCOPE),
    default: 'all',
    required: false
  })
  @IsOptional()
  @IsEnum(SEARCH_SCOPE)
  scope?: SearchScope;

  @ApiProperty({
    description: 'Page number (1-based).',
    type: Number,
    default: 1,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({
    description: 'Page size.',
    type: Number,
    default: 20,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class FriendActionRequest {
  @ApiProperty({
    description: 'Target user id.',
    type: String,
    example: '67dcf6f96bb8ca8b2e83f111'
  })
  @IsMongoId()
  userId: string;

  @ApiProperty({
    description: 'Friend action to perform.',
    enum: Object.values(FRIEND_ACTION),
    example: 'send_request'
  })
  @IsEnum(FRIEND_ACTION)
  action: FriendAction;
}


export class FriendRequestsListRequest {
  @ApiProperty({
    description: 'Page number (1-based).',
    type: Number,
    default: 1,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({
    description: 'Page size.',
    type: Number,
    default: 20,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
