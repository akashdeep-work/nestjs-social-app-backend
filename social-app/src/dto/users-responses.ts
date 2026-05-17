import { IsString, IsNotEmpty, IsArray, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { User } from './user';
import { Subscription } from './subscription';
import { LoginProviders, UserStatus } from 'src/helpers/constants';

/**
 * Data Transfer Object (DTO) for email login.
 */
export class UserLoginResponse extends User {
  /**
   * Login token for user.
   */
  @ApiProperty({
    description: 'Login token for user.',
    type: String,
    example: 'eyz.3egh434urhjhi',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

/**
 * Data Transfer Object (DTO) for representing basic user info.
 */
export class BasicUserInfo {
  /**
   * Username of the user.
   */
  @ApiProperty({
    description: 'Username of the user.',
    type: String,
    example: 'johndoe3579'
  })
  @IsString()
  @IsNotEmpty()
  username: string;
  
  /**
   * Email of the user.
   */
  @ApiProperty({
    description: 'Email of the user.',
    type: String,
    example: 'johndoe3579@social-app.com'
  })
  @IsString()
  @IsNotEmpty()
  email: string;
  
  /**
   * Phone number of the user.
   */
  @ApiProperty({
    description: 'Phone number of the user.',
    type: String,
    example: '+916724851987'
  })
  @IsString()
  @IsNotEmpty()
  phone: string;
  
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
   * Status of the user.
   */
  @ApiProperty({
    description: 'Status of the user.',
    type: String,
    example: 'VERIFIED'
  })
  @IsString()
  @IsNotEmpty()
  status: UserStatus;
  
  /**
   * Subscription plan of the user.
   */
  @ApiProperty({
    description: 'Subscription plan of the user.',
    type: Subscription,
    example: '{ "name": "PLATINUM", "validity": 12, "active": true }'
  })
  @IsString()
  @IsNotEmpty()
  subscription: Subscription;
}

/**
 * Data Transfer Object (DTO) for fetch user info response.
 */
export class FetchUserInfoResponse {
  /**
   * A list of accounts the user has.
   */
  @ApiProperty({
    description: 'A list of accounts the user has.',
    type: Array<BasicUserInfo>,
    example: '[]'
  })
  @IsArray()
  @IsNotEmpty()
  accounts: Array<BasicUserInfo>;
}

/**
 * Data Transfer Object (DTO) for reset password response.
 */
export class PasswordResetResponse {
  /**
   * Boolean flag indicating password reset success.
   */
  @ApiProperty({
    description: 'Boolean flag indicating password reset success',
    type: Boolean,
    example: 'true'
  })
  @IsBoolean()
  @IsNotEmpty()
  success: boolean;
}