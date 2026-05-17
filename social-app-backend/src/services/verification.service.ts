import { Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';

import { SERVICE, VerificationTypes } from '../helpers/constants';
import { CustomLoggerService } from './logging/custom-logger.service';
import { IllegalStateError } from '../exceptions/illegal-state.error';
import { VerificationRepository } from '../repositories/verification.repository';
import { VerificationDocument } from 'src/schemas/verification.schema';
import { VerificationCodeResponse } from 'src/dto/verification-responses';
import { SendVerificationCodeRequest, VerifyCodeRequest } from 'src/dto/verification-requests';
import { UserRepository } from 'src/repositories/user.repository';
import { CommonErrors } from 'src/helpers/errors';
import { TwilioService } from './twilio.service';
import { InvalidOtpException, OtpUserNotFoundException, SomethingWentWrongException } from 'src/exceptions/general.error';
import { UserNotFoundError } from 'src/exceptions/validation';
import { BaseHttpException } from 'src/exceptions/base-http.exception';

@Injectable()
export class VerificationService {
  private readonly logger = new CustomLoggerService(SERVICE, VerificationService.name);

  constructor(
    private readonly verificationRepository: VerificationRepository,
    private readonly userRepository: UserRepository,
    private readonly twilioService: TwilioService
  ) {}

  // Generate a cryptographically secure random integer within the desired range.
  private generateVerificationCode(length = 6) {
    // For a 6-digit OTP, the range is from 100,000 to 999,999.
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
      
    // crypto.randomInt generates a random integer within the specified range (inclusive of min, exclusive of max).
    // To make it inclusive of max, we add 1 to max.
    const otp = randomInt(min, max + 1); 
      
    return otp.toString(); // Return as a string to handle potential leading zeros if length was not fixed at 6.
  }

  async sendVerificationCode({ handle, type }: SendVerificationCodeRequest): Promise<VerificationCodeResponse> {
    try {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5) // Add 5 minutes to the expiry time for the verification code.

      if([VerificationTypes.LOGIN, VerificationTypes.RESET_PASSWORD].includes(type)){
        const [ userByEmail, userByPhone ] = await Promise.all([
          this.userRepository.findAll({ email: handle }),
          this.userRepository.findAll({ phone: handle })
        ]);

        if(!(userByEmail.length || userByPhone.length)){
          throw new OtpUserNotFoundException();
        }
      }

      const code = this.generateVerificationCode(6); // This verification code will be overwritten by Twilio.
      const [ verification ] = await this.verificationRepository.insertUpdate({
        handle,
        code,
        expiresAt,
        verified: false,
        type
      });

      if(handle.includes('@'))
        await this.twilioService.startVerification(handle, 'email');
      else
        await this.twilioService.startVerification(handle, 'sms');

      return {
        handle: verification.handle,
        type: verification.type,
        expiresAt: verification.expiresAt
      };
    } catch (error) {
      // Handle validation or other errors
      const details = 'Error while sending verification code: ' + error.message;
      this.logger.error(details);
      if (error instanceof BaseHttpException || error instanceof IllegalStateError) {
        throw error;
      }
      throw new SomethingWentWrongException(details);
    }
  }

  async verifyVerificationCode({ handle, code, type }: VerifyCodeRequest): Promise<VerificationCodeResponse> {
    try {
      let verified = false;

      const [ verification ] = await this.verificationRepository.findAll({ handle, verified, type });

      if(verification?.expiresAt){
        const codeExpiryDateTime = new Date(verification.expiresAt);
        const currentDateTime = new Date();

        const twilioVerification = await this.twilioService.checkVerification(handle, code);

        if(twilioVerification.valid && codeExpiryDateTime > currentDateTime){
          const [ updatedVerification ] = await this.verificationRepository.insertUpdate({
            handle,
            verified: true
          });

          verified = updatedVerification.verified;
        }
        else {
          throw new InvalidOtpException();
        }
      }

      return {
        handle,
        verified,
        type
      };
    } catch (error) {
      // Handle validation or other errors
      const details = 'Error while verifying code: ' + error.message;
      this.logger.error(details);
      if (error instanceof BaseHttpException || error instanceof IllegalStateError) {
        throw error;
      }
      throw new SomethingWentWrongException(details);
    }
  }

  async getVerificationStatus({ handle, type }: SendVerificationCodeRequest): Promise<VerificationDocument> {
    try {
      const [ verification ] = await this.verificationRepository.findAll({ handle, type });
      return verification ;
    } catch (error) {
      // Handle validation or other errors
      const details = 'Error while getting verification status: ' + error.message;
      this.logger.error(details);
      if (error instanceof BaseHttpException || error instanceof IllegalStateError) {
        throw error;
      }
      throw new SomethingWentWrongException(details);
    }
  }

  async sendVerificationEmail(to: string, code: string) {
    try {
      await this.twilioService.sendEmail(
        to,
        'Verification code',
        `Your verification code is: ${code}`,
        `<p>Your verification code is: <strong>${code}</strong></p>`
      );
    } catch (error) {
      const details = 'Error while sending verification email' + error.message;
      this.logger.error(details);
      if (error instanceof BaseHttpException || error instanceof IllegalStateError) {
        throw error;
      }
      throw new SomethingWentWrongException(details);
    }
  }

  async sendVerificationSms(to: string, code: string) {
    try {
      await this.twilioService.sendSms(
        to,
        `Your verification code is: ${code}`
      );
    } catch (error) {
      const details = 'Error while sending verification sms' + error.message;
      this.logger.error(details);
      if (error instanceof BaseHttpException || error instanceof IllegalStateError) {
        throw error;
      }
      throw new SomethingWentWrongException(details);
    }
  }
}
