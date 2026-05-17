import { IsString, IsNotEmpty, IsOptional, IsNumber, IsObject, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Data Transfer Object (DTO) for representing geo-location.
 */
export class Geolocation {
  /**
   * Latitude.
   */
  @ApiProperty({
    description: 'Latitude.',
    type: Number,
    example: '30.573876'
  })
  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  /**
   * Longitude.
   */
  @ApiProperty({
    description: 'Longitude.',
    type: Number,
    example: '76.7767358'
  })
  @IsNumber()
  @IsNotEmpty()
  longitude: number;
}

/**
 * Data Transfer Object (DTO) for representing address of the user.
 */
export class Address {
  /**
   * Address.
   */
  @ApiProperty({
    description: 'Address.',
    type: String,
    example: 'N123 Malibu Point'
  })
  @IsString()
  @IsOptional()
  address?: string;

  /**
   * City name.
   */
  @ApiProperty({
    description: 'City name.',
    type: String,
    example: 'Las Vegas'
  })
  @IsString()
  @IsOptional()
  city?: string;

  /**
   * State/Province name.
   */
  @ApiProperty({
    description: 'State/Province name.',
    type: String,
    example: 'Nevada',
    required: false
  })
  @IsString()
  @IsOptional()
  state?: string;

  /**
   * Zip/Pin code.
   */
  @ApiProperty({
    description: 'Zip/Pin code.',
    type: String,
    example: '89030',
    required: false
  })
  @IsString()
  @IsOptional()
  zip?: string;

  /**
   * Country name.
   */
  @ApiProperty({
    description: 'Country name.',
    type: String,
    example: 'United States',
    required: false
  })
  @IsString()
  @IsOptional()
  country?: string;

  /**
   * Geo-location of the user in latitude,longitude format.
   */
  @ApiProperty({
    description: 'Geo-location of the user in latitude longitude.',
    type: Geolocation,
    example: '{"latitude": 30.573876, "longitude": 76.7767358}',
    required: false
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => Geolocation)
  geolocation?: Geolocation;
}