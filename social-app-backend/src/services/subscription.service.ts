import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';

import { SERVICE, UserRoles } from '../helpers/constants';
import { CustomLoggerService } from './logging/custom-logger.service';
import { IllegalStateError } from '../exceptions/illegal-state.error';
import { SubscriptionRepository } from 'src/repositories/subscription.repository';
import { SubscriptionDocument } from 'src/schemas/subscription.schema';
import { FetchSubscriptionPlans, SubscribeToPlan } from 'src/dto/subscription-requests';
import { SomethingWentWrongException, SubscriptionNotFoundException } from 'src/exceptions/general.error';
import { BaseHttpException } from 'src/exceptions/base-http.exception';
import { Subscription } from 'src/dto/subscription';
import { UserRepository } from 'src/repositories/user.repository';

@Injectable()
export class SubscriptionService {
  private readonly logger = new CustomLoggerService(SERVICE, SubscriptionService.name);

  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly userRepository: UserRepository
  ) {}

  async fetchSubscriptionPlans(request: FetchSubscriptionPlans): Promise<Array<SubscriptionDocument>> {
    try {
      const { _id, name, validity, price, type } = request;

      return await this.subscriptionRepository.findAll({
        ...(_id ? { _id: new Types.ObjectId(_id) } : {}),
        ...(name ? { name } : {}),
        ...(validity ? { validity } : {}),
        ...(price ? { price } : {}),
        ...(type ? { type: UserRoles[type] } : {}),
      });
    } catch (error) {
      // Handle validation or other errors
      const details = 'Error while fetching subscriptions: ' + error.message;
      this.logger.error(details);
      if (error instanceof BaseHttpException || error instanceof IllegalStateError) {
        throw error;
      }
      throw new SomethingWentWrongException(details);
    }
  }

  async subscribeToPlan(request: SubscribeToPlan, email: string): Promise<Subscription> {
    try {
      const { _id } = request;

      const [user] =  await this.userRepository.findAll({ email });
      const [requestedPlan] =  await this.subscriptionRepository.findAll({ _id: new Types.ObjectId(String(_id)) });

      if(!requestedPlan){
        throw new SubscriptionNotFoundException();
      }

      const { _id: id, name, type, validity, active } = requestedPlan;

      user.subscription.id = new Types.ObjectId(String(id)) as any;
      user.subscription.name = name;
      user.subscription.type = type;
      user.subscription.validity = validity;
      user.subscription.expiresAt = new Date(new Date().setMonth(new Date().getMonth() + Math.floor(validity/30)));
      user.subscription.active = active;

      const [ updatedUser ] = await this.userRepository.update(user);

      return updatedUser.subscription;

    } catch (error) {
      // Handle validation or other errors
      const details = 'Error while subscribing to billing plan: ' + error.message;
      this.logger.error(details);
      if (error instanceof BaseHttpException || error instanceof IllegalStateError) {
        throw error;
      }
      throw new SomethingWentWrongException(details);
    }
  }
}
