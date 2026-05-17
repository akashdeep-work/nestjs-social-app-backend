import { IsObject, IsString, IsNotEmpty, IsOptional, ValidateNested, IsArray, IsBoolean, IsNumber, IsEnum } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

import { Address } from './address';
import { Subscription } from './subscription';
import { LoginProviders, PreferredEyeColor, PreferredHairColor, UserEducation, UserEducationField, UserJobIndustry, UserRelationship, UserStatus } from '../helpers/constants';
import { Role } from './role';

export class EducationDetails {
  /**
   * Education.
   */
  @ApiProperty({
    description: 'Education.',
    type: String,
    example: 'Graduate',
    required: false
  })
  @IsEnum(UserEducation)
  @IsOptional()
  title?: UserEducation;

  /**
   * Field of education.
   */
  @ApiProperty({
    description: 'Field of education.',
    type: String,
    example: 'Field',
    required: false
  })
  @IsEnum(UserEducationField)
  @IsOptional()
  field?: UserEducationField;
}

export class JobDetails {
  /**
   * Job title.
   */
  @ApiProperty({
    description: 'Job title.',
    type: String,
    example: 'SDE',
    required: false
  })
  @IsString()
  @IsOptional()
  title?: string;

  /**
   * Job industry.
   */
  @ApiProperty({
    description: 'Job industry.',
    type: String,
    example: 'IT',
    required: false
  })
  @IsEnum(UserJobIndustry)
  @IsOptional()
  industry?: UserJobIndustry;
}

export class PersonalDetails {
  /**
   * Relationship status.
   */
  @ApiProperty({
    description: 'Relationship status.',
    type: String,
    example: 'Single',
    required: false
  })
  @IsEnum(UserRelationship)
  @IsOptional()
  relationship?: UserRelationship;

  /**
   * Have kids.
   */
  @ApiProperty({
    description: 'Have kids.',
    type: Boolean,
    example: 'false',
    required: false
  })
  @IsBoolean()
  @IsOptional()
  haveKids?: boolean;

  /**
   * Number of kids.
   */
  @ApiProperty({
    description: 'Number of kids.',
    type: Number,
    example: '0',
    required: false
  })
  @IsNumber()
  @IsOptional()
  kids?: number;
}

class PreferenceRange {
  /**
   * Age/Height/Distance start range.
   */
  @ApiProperty({
    description: 'Age/Height/Distance start range.',
    type: Number,
    example: '18',
    required: true
  })
  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  from: number;

  /**
   * Age/Height/Distance end range.
   */
  @ApiProperty({
    description: 'Age/Height/Distance end range.',
    type: Number,
    example: '30',
    required: true
  })
  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  to: number;
}

export class UserPreferences {
  /**
   * Age range.
   */
  @ApiProperty({
    description: 'Age range.',
    type: PreferenceRange,
    example: '{}',
    required: false
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => PreferenceRange)
  age?: PreferenceRange;

  /**
   * Height range.
   */
  @ApiProperty({
    description: 'Height range.',
    type: PreferenceRange,
    example: '{}',
    required: false
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => PreferenceRange)
  height?: PreferenceRange;

  /**
   * Eye color.
   */
  @ApiProperty({
    description: 'Eye color.',
    type: String,
    example: 'green',
    required: false
  })
  @IsEnum(PreferredEyeColor)
  @IsOptional()
  eyeColor?: PreferredEyeColor;

  /**
   * Hair color.
   */
  @ApiProperty({
    description: 'Hair color.',
    type: String,
    example: 'Blonde',
    required: false
  })
  @IsEnum(PreferredHairColor)
  @IsOptional()
  hairColor?: PreferredHairColor;
}

export class UserInterests {
  /**
   * Interest Id.
   */
  @ApiProperty({
    description: 'Interest Id.',
    type: String,
    example: 'ObjectId("67853616abf87a4196fe226e")',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  /**
   * Interest name.
   */
  @ApiProperty({
    description: 'Interest name.',
    type: String,
    example: 'Photography',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}

/**
 * Data Transfer Object (DTO) for representing a user.
 */
export class User {

  /**
   * Interest Id.
   */
  @ApiProperty({
    description: 'User Id.',
    type: String,
    example: 'ObjectId("67853616abf87a4196fe226e")',
    required: false
  })
  @IsString()
  @IsNotEmpty()
  id?: string;

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
    example: 'johndoe3579@social-app.com',
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
   * Encrypted password of the user.
   */
  @ApiProperty({
    description: 'Encrypted password of the user.',
    type: String,
    example: '2uygr6irg9urh2iurgbrfn3nk',
    required: false
  })
  @IsString()
  @IsOptional()
  password?: string;

  /**
   * Fullname of the user.
   */
  @ApiProperty({
    description: 'Fullname of the user.',
    type: String,
    example: 'John Doe'
  })
  @IsString()
  @IsNotEmpty()
  fullname: string;

  /**
   * Profile picture of the user.
   */
  @ApiProperty({
    description: 'Profile picture of the user.',
    type: String,
    example: 'https://abc.com/xyz.jpg',
    required: false
  })
  @IsString()
  @IsOptional()
  picture?: string;

  /**
   * Login provider.
   */
  @ApiProperty({
    description: 'Login provider.',
    type: String,
    example: 'google',
    required: false
  })
  @IsString()
  @IsOptional()
  provider?: LoginProviders;

  /**
   * Roles of the user.
   */
  @ApiProperty({
    description: 'Roles of the user.',
    type: Array<Role>,
    example: '[]',
    required: false
  })
  @IsArray()
  @IsOptional()
  roles?: Array<Role>;

  /**
   * Date of birth of the user in DD/MM/YYYY format.
   */
  @ApiProperty({
    description: 'Date of birth of the user in DD/MM/YYYY format.',
    type: String,
    example: '09/09/1999'
  })
  @IsString()
  @IsNotEmpty()
  dob: string;

  /**
   * Gender of the user.
   */
  @ApiProperty({
    description: 'Gender of the user.',
    type: String,
    example: 'Male/Female/Prefer not to say'
  })
  @IsString()
  @IsNotEmpty()
  gender: string;

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
    type: Array<UserInterests>,
    example: '["692d8b006e1386329880a597","692d8b006e1386329880a598"]',
    required: false
  })
  @IsArray()
  @IsOptional()
  interests?: Array<UserInterests> //(multi-select or chips)

  /**
   * Status of the user.
   */
  @ApiProperty({
    description: 'Status of the user.',
    type: String,
    example: 'VERIFIED',
    required: false
  })
  @IsString()
  @IsOptional()
  status?: UserStatus;

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

  /**
   * Subscription plan of the user.
   */
  @ApiProperty({
    description: 'Subscription plan of the user.',
    type: Subscription,
    example: '{ "name": "PLATINUM", "validity": 12, "active": true }',
    required: false
  })
  @IsObject()
  @IsOptional()
  subscription?: Subscription;
}