import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import { Subscription, SubscriptionDocument } from 'src/schemas/subscription.schema';
import type { ItemOrArray } from '../types/common.types';
import { SERVICE, UserRoles, UserSubscriptions } from 'src/helpers/constants';
import { CustomLoggerService } from 'src/services/logging/custom-logger.service';
import { SomethingWentWrongException } from 'src/exceptions/general.error';

type FindFilters = {
  _id?: ItemOrArray<Types.ObjectId>;
  name?: ItemOrArray<UserSubscriptions>;
  validity?: ItemOrArray<number>;
  price?: ItemOrArray<string>;
  type?: ItemOrArray<UserRoles>;
  active?: boolean;
};

@Injectable()
export class SubscriptionRepository {
  private readonly logger = new CustomLoggerService(SERVICE, SubscriptionRepository.name);

  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>
  ) {}

  /**
   * Find all Subscription documents in the database, optionally filtered.
   * @param _id - Optional. Return specified subscription by id
   * @param name - Optional. Return specified subscription by name
   * @param validity - Optional. Return specified subscription by validity
   * @param price - Optional. Return specified subscription by price
   * @param type - Optional. Return specified subscription by type
   * @returns An array of JSON objects representing the found subscriptions
   */
  async findAll({ _id, name, validity, price, type, active = true }: FindFilters): Promise<Array<SubscriptionDocument>> {
    try{
      const query: FilterQuery<SubscriptionDocument> = {
        ...(_id ? { _id } : {}),
        ...(name ? { name: { $in: Array.isArray(name) ? name : [name] } } : {}),
        ...(validity ? { validity: { $in: Array.isArray(validity) ? validity : [validity] } } : {}),
        ...(price ? { price: { $in: Array.isArray(price) ? price : [price] } } : {}),
        ...(type ? { type: { $in: Array.isArray(type) ? type : [type] } } : {}),
        active
      };

      return await this.subscriptionModel.find(query).exec();
    }
    catch (error) {
      const details = `Error while finding subscription record: ${error.message}`;
      this.logger.error(details);
      throw new SomethingWentWrongException(details);
    }
  }
}
