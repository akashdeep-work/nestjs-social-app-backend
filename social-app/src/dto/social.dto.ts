import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested
} from 'class-validator';
import { MEDIA_TYPE, MediaType } from 'src/helpers/constants';

export class PostMediaDto {
  @ApiProperty({ description: 'Media URL' })
  @IsString()
  url: string;

  @ApiProperty({ description: 'Media type', enum: MEDIA_TYPE })
  @IsEnum(MEDIA_TYPE)
  type: MediaType;
}

export class CreatePostDto {
  @ApiProperty({ description: 'Text content of the post' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({ type: [PostMediaDto] })
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => PostMediaDto)
  @IsOptional()
  media?: PostMediaDto[];

  @ApiPropertyOptional({ type: [String], deprecated: true, description: 'Deprecated. Use media[] instead.' })
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @IsOptional()
  mediaUrls?: string[];

  @ApiPropertyOptional({ default: false })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isStory?: boolean;
}

export class UpdatePostDto {
  @ApiPropertyOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ type: [PostMediaDto] })
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => PostMediaDto)
  @IsOptional()
  media?: PostMediaDto[];

  @ApiPropertyOptional({ type: [String], deprecated: true, description: 'Deprecated. Use media[] instead.' })
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @IsOptional()
  mediaUrls?: string[];
}

export class HomeFeedQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}
