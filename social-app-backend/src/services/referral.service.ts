import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { Types } from 'mongoose';

import { DEFAULT_REFERRAL_EXPIRY_HOURS, SERVICE, TWILIO_ENABLED, UserSubscriptions } from '../helpers/constants';
import { CustomLoggerService } from './logging/custom-logger.service';
import { IllegalStateError } from '../exceptions/illegal-state.error';
import { ReferralRepository } from '../repositories/referral.repository';
import { SendReferralCodeResponse, ValidateReferralCodeResponse } from 'src/dto/referral-responses';
import { SendReferralCodeRequest } from 'src/dto/referral-requests';
import { UserRepository } from 'src/repositories/user.repository';
import { ReferralErrors } from 'src/helpers/errors';
import { TwilioService } from './twilio.service';
import { InvalidReferralCodeException, NonPremiumReferralException, SelfReferralException, SomethingWentWrongException } from 'src/exceptions/general.error';
import { BaseHttpException } from 'src/exceptions/base-http.exception';

@Injectable()
export class ReferralService {
  private readonly logger = new CustomLoggerService(SERVICE, ReferralService.name);
  private readonly REFERRAL_EXPIRY_HOURS: number;
  private readonly REFERRAL_BASE_URL: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly referralRepository: ReferralRepository,
    private readonly userRepository: UserRepository,
    private readonly twilioService: TwilioService
  ) {
    this.REFERRAL_EXPIRY_HOURS = DEFAULT_REFERRAL_EXPIRY_HOURS;
    this.REFERRAL_BASE_URL = this.configService.get<string>('REFERRAL_BASE_URL');
  }

  generateReferralCode(to: string, from: string): string {
    // Combine user emails with a random string for uniqueness
    const randomString = randomBytes(8).toString('hex');

    const hash = createHash('sha256')
      .update(to + from + randomString)
      .digest('hex')
      .toUpperCase();

    // Take first 8 chars for brevity
    return hash.substring(0, 8);
  }

  generateReferralLink(code: string, to: string): string {
    return `${this.REFERRAL_BASE_URL}?ref=${code}&to=${to}`;
  }

  async sendReferralCode({ to, type }: SendReferralCodeRequest, currentUser: any): Promise<SendReferralCodeResponse> {
    try {
      const from = currentUser.email.trim().toLowerCase();

      if(to === from){
        throw new SelfReferralException();
      }

      const [ user ] = await this.userRepository.findAll({ email: from });
      const { subscription } = user;
      const subscriptionExpiryDateTime = new Date(subscription.expiresAt);
      const currentDateTime = new Date();

      if(subscription.name === UserSubscriptions.BASIC || currentDateTime > subscriptionExpiryDateTime){
        throw new NonPremiumReferralException();
      }

      const code = this.generateReferralCode(to, user.email);
      const link = this.generateReferralLink(code, to);

      if(TWILIO_ENABLED){
        await this.twilioService.sendEmail(
          to,
          'Social App Referral',
          `Referral link: ${link}`
        );
      }

      currentDateTime.setHours(currentDateTime.getHours() + this.REFERRAL_EXPIRY_HOURS) // Add hours to the expiry time for the referral code.
      
      const [ referral ] = await this.referralRepository.insertUpdate({
        code,
        to,
        from: new Types.ObjectId(String(user._id)),
        url: link,
        type,
        used: false,
        expiresAt: currentDateTime
      });

      return { expiresAt: referral.expiresAt };
    } catch (error) {
      // Handle validation or other errors
      const details = 'Error while sending referral code: ' + error.message;
      this.logger.error(details);
      if (error instanceof BaseHttpException || error instanceof IllegalStateError) {
        throw error;
      }
      throw new SomethingWentWrongException(details);
    }
  }

  async validateReferralCode(code: string, email: string): Promise<ValidateReferralCodeResponse> {
    try {
      const [ referral ] = await this.referralRepository.findAll({ code });
      
      if(!referral || referral.to !== email){
        throw new InvalidReferralCodeException();
      }
      
      if(referral.used){
        throw new InvalidReferralCodeException();
      }
      
      const codeExpiryDateTime = new Date(referral.expiresAt);
      const currentDateTime = new Date();
      
      if(currentDateTime > codeExpiryDateTime){
        throw new InvalidReferralCodeException();
      }
      
      const [ referredBy ] = await this.userRepository.findAll({ _id: referral.from });
      
      let offers: UserSubscriptions = UserSubscriptions.BASIC;

      if(referredBy.subscription){
        const subscriptionExpiryDateTime = new Date(referredBy.subscription.expiresAt);
      
        if(currentDateTime > subscriptionExpiryDateTime){
          throw new InvalidReferralCodeException();
        }

        offers = UserSubscriptions[referredBy.subscription.name];
      }
      else {
        throw new InvalidReferralCodeException();
      }

      return { valid: true, offers };
    } catch (error) {
      // Handle validation or other errors
      const details = 'Error while validating referral code: ' + error.message;
      this.logger.error(details);
      if (error instanceof BaseHttpException || error instanceof IllegalStateError) {
        throw error;
      }
      throw new SomethingWentWrongException(details);
    }
  }

  async updateReferralCodeStatus(code: string, used: boolean): Promise<boolean> {
    try {
      const [ referral ] = await this.referralRepository.insertUpdate({ code, used });
      
      return referral.used;
    } catch (error) {
      // Handle validation or other errors
      const details = 'Error while updating referral code: ' + error.message;
      this.logger.error(details);
      if (error instanceof BaseHttpException || error instanceof IllegalStateError) {
        throw error;
      }
      throw new SomethingWentWrongException(details);
    }
  }
}
