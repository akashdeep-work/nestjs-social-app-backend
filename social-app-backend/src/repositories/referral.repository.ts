import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import { Referral, ReferralDocument, UpdateReferralDocument } from 'src/schemas/referral.schema';
import { UserDocument } from 'src/schemas/user.schema';
import type { ItemOrArray } from '../types/common.types';
import { ReferralTypes, SERVICE } from 'src/helpers/constants';
import { SomethingWentWrongException } from 'src/exceptions/general.error';
import { CustomLoggerService } from 'src/services/logging/custom-logger.service';

type FindFilters = {
  _id?: ItemOrArray<Types.ObjectId>;
  code?: ItemOrArray<string>;
  to?: ItemOrArray<string>;
  from?: string | UserDocument;
  type?: ItemOrArray<ReferralTypes>;
  used?: boolean;
  expiresAt?: ItemOrArray<Date>;
};

@Injectable()
export class ReferralRepository {
  private readonly logger = new CustomLoggerService(SERVICE, ReferralRepository.name);
  
  constructor(
    @InjectModel(Referral.name)
    private referralModel: Model<ReferralDocument>
  ) {}

  /**
   * Insert or update referral data.
   * @param updateReferralDTO - An object or an array of object reprsenting the referral data to be updated.
   * @returns An array of JSON objects representing the updated referral data
   */
  async insertUpdate(updateReferralDTO: ItemOrArray<UpdateReferralDocument>): Promise<Array<ReferralDocument>> {
      const dtoArray = Array.isArray(updateReferralDTO) ? updateReferralDTO : [updateReferralDTO];
  
      return await Promise.all(
        dtoArray.map(async dto => {
          const { code, ...update } = dto;
          try {
            return await this.referralModel.findOneAndUpdate({ code }, update, {
              new: true,
              upsert: true,
              runValidators: true
            });
          } catch (error) {
            const details = `Error while inserting referral record: ${error.message}`;
            this.logger.error(details);
            throw new SomethingWentWrongException(details);
          }
        })
      );
    }

  /**
   * Find all Referral documents in the database, optionally filtered.
   * @param _id - Optional. Return specified referral by id
   * @param code - Optional. Return specified referral code
   * @param to - Optional. Return specified referral by email
   * @param from - Optional. Return specified referral by referer user id
   * @param type - Optional. Return specified referral by type
   * @param used - Optional. Return specified referral by used status
   * @returns An array of JSON objects representing the found referrals
   */
  async findAll({ _id, code, to, from, type, used = false }: FindFilters): Promise<Array<ReferralDocument>> {
    try{
      const query: FilterQuery<ReferralDocument> = {
        ...(_id ? { _id } : {}),
        ...(code ? { code: { $in: Array.isArray(code) ? code : [code] } } : {}),
        ...(to ? { to: { $in: Array.isArray(to) ? to : [to] } } : {}),
        ...(from ? { from: { $in: Array.isArray(from) ? from : [from] } } : {}),
        ...(type ? { type: { $in: Array.isArray(type) ? type : [type] } } : {}),
        ...(used ? { used: { $in: Array.isArray(used) ? used : [used] } } : {}),
        used
      };

      return await this.referralModel.find(query).exec();
    }
    catch(error){
      const details = `Error while finding referral record: ${error.message}`;
      this.logger.error(details);
      throw new SomethingWentWrongException(details);
    }
  }
}
