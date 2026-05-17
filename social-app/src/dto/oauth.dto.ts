import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUrl } from 'class-validator';
import { LoginProviders } from 'src/helpers/constants';

export class OAuthProfileDto {
  @IsString()
  id: string;

  @IsString()
  displayName: string;

  @IsString()
  provider: LoginProviders;

  @IsEmail()
  @IsOptional()
  email?: string; // Requires 'email' permission

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsUrl()
  @IsOptional()
  picture?: string;

  @IsString()
  @IsOptional()
  gender?: string; // Requires 'user_gender' permission

  @IsString()
  @IsOptional()
  birthday?: string; // Requires 'user_birthday' permission

  @IsString()
  @IsOptional()
  phone?: string; // Requires 'user_mobile_phone' permission (not always available)
}

export class MobileTokenDto {
  @IsString()
  providerToken: string; // ID token for Google, access token for FB/LinkedIn
}

export class SocialProfileDto {
  @ApiProperty({ example: 'GOOGLE' })
  provider: LoginProviders;

  @ApiProperty({ example: '1234567890' })
  providerId: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg' })
  picture?: string;
}

export class GoogleProfileDto {
  @ApiPropertyOptional() iss?: string;      // Issuer
  @ApiPropertyOptional() azp?: string;      // Authorized party
  @ApiPropertyOptional() aud?: string;      // Audience (Client ID)
  @ApiPropertyOptional() sub?: string;      // Subject (unique ID)
  @ApiPropertyOptional() email?: string;
  @ApiPropertyOptional() email_verified?: string;
  @ApiPropertyOptional() name?: string;
  @ApiPropertyOptional() picture?: string;
  @ApiPropertyOptional() given_name?: string;
  @ApiPropertyOptional() family_name?: string;
  @ApiPropertyOptional() locale?: string;
  @ApiPropertyOptional() iat?: string;      // Issued at
  @ApiPropertyOptional() exp?: string;      // Expiration time
}

export class FacebookProfileDto {
  @ApiPropertyOptional() id?: string;
  @ApiPropertyOptional() name?: string;
  @ApiPropertyOptional() email?: string;
}

export class LinkedInProfileDto {
  @ApiPropertyOptional() id?: string;
  @ApiPropertyOptional() localizedFirstName?: string;
  @ApiPropertyOptional() localizedLastName?: string;
  @ApiPropertyOptional() profilePicture?: string;
  @ApiPropertyOptional() email?: string;
}