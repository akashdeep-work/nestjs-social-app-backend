import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRoles } from 'src/helpers/constants';
import { ObjectId, Types } from 'mongoose';


/**
 * Data Transfer Object (DTO) for representing the user role.
 */
export class Role {
  /**
   * Role Id
   */
  @ApiProperty({
    description: 'Role Id',
    type: Types.ObjectId,
    example: 'ObjectId("67853616abf87a4196fe226e")'
  })
  @IsString()
  @IsNotEmpty()
  id: ObjectId;

  /**
   * Role name
   */
  @ApiProperty({
    description: 'Role name',
    type: String,
    example: 'INDIVIDUAL'
  })
  @IsString()
  @IsNotEmpty()
  name: UserRoles;
}