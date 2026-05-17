import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import { Verification, UpdateVerificationDocument, VerificationDocument } from '../schemas/verification.schema';
import type { ItemOrArray } from '../types/common.types';
import { SERVICE, VerificationTypes } from 'src/helpers/constants';
import { SomethingWentWrongException } from 'src/exceptions/general.error';
import { CustomLoggerService } from 'src/services/logging/custom-logger.service';

type FindFilters = {
  _id?: ItemOrArray<Types.ObjectId>;
  handle?: ItemOrArray<string>;
  type?: ItemOrArray<VerificationTypes>;
  code?: ItemOrArray<string>;
  verified?: ItemOrArray<boolean>;
  expiresAt?: ItemOrArray<Date>;
};

@Injectable()
export class VerificationRepository {
  private readonly logger = new CustomLoggerService(SERVICE, VerificationRepository.name);

  constructor(
    @InjectModel(Verification.name)
    private verificationModel: Model<VerificationDocument>
  ) {}

  /**
   * Insert or update verification data.
   * @param updateVerificationDTO - An object or an array of object reprsenting the verification data to be updated.
   * @returns An array of JSON objects representing the updated verification data
   */
  async insertUpdate(updateVerificationDTO: ItemOrArray<UpdateVerificationDocument>): Promise<Array<VerificationDocument>> {
    const dtoArray = Array.isArray(updateVerificationDTO) ? updateVerificationDTO : [updateVerificationDTO];

    return await Promise.all(
      dtoArray.map(async dto => {
        const { handle, ...update } = dto;
        try {
          return await this.verificationModel.findOneAndUpdate({ handle }, update, {
            new: true,
            upsert: true,
            runValidators: true
          });
        } catch (error) {
          const details = `Error while updating verification record: ${error.message}`;
          this.logger.error(details);
          throw new SomethingWentWrongException(details);
        }
      })
    );
  }

  /**
   * Find all Verification documents in the database, optionally filtered.
   * @param _id - Optional. Return specified verification by id
   * @param handle - Optional. Return specified verification by handle
   * @param code - Optional. Return specified verification by code
   * @param verified - Optional. Return specified verification by verified flag
   * @param type - Optional. Return specified verification by code type
   * @returns An array of JSON objects representing the found Verifications
   */
  async findAll({ _id, handle, code, verified, type }: FindFilters): Promise<Array<VerificationDocument>> {
    try{
      const query: FilterQuery<VerificationDocument> = {
        ...(_id ? { _id } : {}),
        ...(handle ? { handle: { $in: Array.isArray(handle) ? handle : [handle] } } : {}),
        ...(code ? { code: { $in: Array.isArray(code) ? code : [code] } } : {}),
        ...(type ? { type: { $in: Array.isArray(type) ? type : [type] } } : {}),
        ...(typeof verified == 'boolean' ? { verified: { $in: Array.isArray(verified) ? verified : [verified] } } : {})
      };

      return await this.verificationModel.find(query).exec();
    }
    catch (error) {
      const details = `Error while finding verification record: ${error.message}`;
      this.logger.error(details);
      throw new SomethingWentWrongException(details);
    }
  }
}
