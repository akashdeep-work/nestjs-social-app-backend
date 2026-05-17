import {
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';


/**
 * Data Transfer Object (DTO) for fetching breach info for an email.
 */
export class GetBreachedAccount {
  /**
   * Email Id.
   */
  @ApiProperty({
    description: 'Email Id.',
    type: String,
    example: 'abc@xyz.com',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;
}