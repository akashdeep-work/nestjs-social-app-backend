import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class BreachInfo {
  @ApiProperty({ example: 'Adobe', description: 'The breach name' })
  @IsString()
  @IsNotEmpty()
  Name: string;

  @ApiProperty({ example: 'Adobe', description: 'A title for the breach' })
  @IsString()
  @IsOptional()
  Title?: string;

  @ApiProperty({ example: 'adobe.com', description: 'The domain of the breached service' })
  @IsString()
  @IsOptional()
  Domain?: string;

  @ApiProperty({ example: '2013-10-04', description: 'The date the breach occurred (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  BreachDate?: string;

  @ApiProperty({ example: '2013-12-04T00:00:00Z', description: 'The date the breach was added to HIBP' })
  @IsString()
  @IsOptional()
  AddedDate?: string;

  @ApiProperty({ example: 152445165, description: 'Number of accounts compromised in the breach' })
  @IsNumber()
  @IsOptional()
  PwnCount?: number;

  @ApiProperty({
    example: 'In October 2013, 153 million Adobe accounts were breached...',
    description: 'Description of the breach'
  })
  @IsString()
  @IsOptional()
  Description?: string;

  @ApiProperty({
    example: ['Email addresses', 'Password hints', 'Passwords', 'Usernames'],
    description: 'List of data classes compromised in the breach'
  })
  @IsArray()
  @IsOptional()
  DataClasses?: string[];

  @ApiProperty({ example: true, description: 'Whether the breach is verified' })
  @IsBoolean()
  @IsOptional()
  IsVerified?: boolean;

  @ApiProperty({ example: false, description: 'Whether the breach is fabricated' })
  @IsBoolean()
  @IsOptional()
  IsFabricated?: boolean;

  @ApiProperty({ example: false, description: 'Whether the breach is sensitive' })
  @IsBoolean()
  @IsOptional()
  IsSensitive?: boolean;

  @ApiProperty({ example: false, description: 'Whether the breach contains retired data' })
  @IsBoolean()
  @IsOptional()
  IsRetired?: boolean;

  @ApiProperty({ example: false, description: 'Whether the breach is spam-related' })
  @IsBoolean()
  @IsOptional()
  IsSpamList?: boolean;

  @ApiProperty({ example: ['adobe', 'creative cloud'], description: 'Related breach references' })
  @IsBoolean()
  @IsOptional()
  IsMalware?: boolean;
}