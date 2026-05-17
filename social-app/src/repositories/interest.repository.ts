import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import type { ItemOrArray } from '../types/common.types';
import { SERVICE } from 'src/helpers/constants';
import { CustomLoggerService } from 'src/services/logging/custom-logger.service';
import { SomethingWentWrongException } from 'src/exceptions/general.error';
import { Interest, InterestDocument } from 'src/schemas/interest.schema';

type FindFilters = {
  _id?: ItemOrArray<Types.ObjectId>;
  name?: ItemOrArray<string>;
  deleted?: boolean;
};

@Injectable()
export class InterestRepository {
  private readonly logger = new CustomLoggerService(SERVICE, InterestRepository.name);

  constructor(
    @InjectModel(Interest.name)
    private interestModel: Model<InterestDocument>
  ) {}

  /**
   * Find all Interest documents in the database, optionally filtered.
   * @param _id - Optional. Return specified interest by id.
   * @param name - Optional. Return specified interest by name.
   * @returns An array of JSON objects representing the found interests.
   */
  async findAll({ _id, name, deleted = false }: FindFilters): Promise<Array<InterestDocument>> {
    try{
      const query: FilterQuery<InterestDocument> = {
        ...(_id ? { _id: { $in: Array.isArray(_id) ? _id : [_id] } } : {}),
        ...(name ? { $or: Array.isArray(name) ? name.map(n => ({ name: { $regex: n, $options: 'i' } })) : [{ name: { $regex: name, $options: 'i' } }] } : {}),
        deleted
      };

      return await this.interestModel.find(query).exec();
    }
    catch (error) {
      const details = `Error while finding interest record: ${error.message}`;
      this.logger.error(details);
      throw new SomethingWentWrongException(details);
    }
  }
}
