// twilio.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import * as sgMail from '@sendgrid/mail';
import { SERVICE, TWILIO_ENABLED } from 'src/helpers/constants';
import { CustomLoggerService } from './logging/custom-logger.service';
import { SomethingWentWrongException } from 'src/exceptions/general.error';

@Injectable()
export class TwilioService {
  private readonly logger = new CustomLoggerService(SERVICE, TwilioService.name);
  private smsClient: Twilio;

  constructor(private readonly configService: ConfigService) {
    // Twilio client
    this.smsClient = new Twilio(
      this.configService.get<string>('TWILIO_ACCOUNT_SID'),
      this.configService.get<string>('TWILIO_AUTH_TOKEN')
    );

    // SendGrid setup
    sgMail.setApiKey(this.configService.get<string>('SENDGRID_API_KEY'));
  }

  /** Send SMS */
  async sendSms(to: string, body: string): Promise<void> {
    try {
      const from = this.configService.get<string>('TWILIO_PHONE_NUMBER');
      const message = await this.smsClient.messages.create({ body, from, to });
      this.logger.log(`SMS sent to ${to}, SID: ${message.sid}`);
    } catch (error) {
      const details = `Failed to send SMS to ${to}: ${error.message || error}`;
      this.logger.error(details);
      throw new SomethingWentWrongException(details);
    }
  }

  /** Make Voice Call */
  async makeCall(to: string, url: string): Promise<void> {
    try {
      const from = this.configService.get<string>('TWILIO_PHONE_NUMBER');
      const call = await this.smsClient.calls.create({ to, from, url });
      this.logger.log(`Call initiated to ${to}, SID: ${call.sid}`);
    } catch (error) {
      const details = `Failed to make call to ${to}: ${error.message || error}`;
      this.logger.error(details);
      throw new SomethingWentWrongException(details);
    }
  }

  /** Send Email via SendGrid */
  async sendEmail(
    to: string,
    subject: string,
    text: string,
    html?: string
  ): Promise<void> {
    try {
      await sgMail.send({
        to,
        from: this.configService.get<string>('SENDGRID_FROM_EMAIL'),
        subject,
        text,
        html,
      });
      this.logger.log(`Email sent to ${to}`);
    } catch (error) {
      const details = `Failed to send email to ${to}: ${error?.response?.body || error.message || error}`;
      this.logger.error(details);
      throw new SomethingWentWrongException(details);
    }
  }

  /** Send Email via SendGrid Dynamic Template */
  async sendEmailTemplate(
    to: string,
    dynamicData: Record<string, any>,
    templateId?: string
  ): Promise<void> {
    try {
      await sgMail.send({
        to,
        from: this.configService.get<string>('SENDGRID_FROM_EMAIL'),
        templateId: templateId || this.configService.get<string>('SENDGRID_TEMPLATE_ID'),
        dynamicTemplateData: dynamicData
      });
      this.logger.log(`Email sent to ${to}`);
    } catch (error) {
      const details = `Failed to send email to ${to}: ${error?.response?.body || error.message || error}`;
      this.logger.error(details);
      throw new SomethingWentWrongException(details);
    }
  }

  /** Start a Twilio Verify (SMS | call | email | WhatsApp) */
  async startVerification(
    to: string,
    channel: 'sms' | 'call' | 'email' | 'whatsapp' = 'sms',
  ) {
    const serviceSid = this.configService.get<string>('TWILIO_VERIFY_SERVICE_SID');
    if (!serviceSid) {
      const msg = 'TWILIO_VERIFY_SERVICE_SID is not configured';
      this.logger.error(msg);
      throw new SomethingWentWrongException(msg);
    }

    // Twilio expects "whatsapp:+15551234567" for WA channel
    const destination =
      channel === 'whatsapp' && !to.startsWith('whatsapp:') ? `whatsapp:${to}` : to;

    try {
      const verification = TWILIO_ENABLED ? await this.smsClient.verify.v2
        .services(serviceSid)
        .verifications.create({
          to: destination,
          channel,
          // Optional extras you might add later:
          // locale: 'en', // to localize SMS/voice
          // customCode: '123456', // if you manage your own codes (email channel supports it)
        }) : { sid: '', status: 'pending', to };

      this.logger.log(
        `Verify started (${channel}) to ${destination}, SID: ${verification.sid}, status: ${verification.status}`,
      );

      return {
        sid: verification.sid,
        status: verification.status, // 'pending'
        to: verification.to,
        channel,
      };
    } catch (error: any) {
      // Twilio verify errors usually have status/code/moreInfo/message
      const details = `Failed to start verification to ${destination}: ${error?.message || error}`;
      this.logger.error(details);
      throw new SomethingWentWrongException(details);
    }
  }

  /** Check a Twilio Verify code */
  async checkVerification(to: string, code: string) {
    const serviceSid = this.configService.get<string>('TWILIO_VERIFY_SERVICE_SID');
    if (!serviceSid) {
      const msg = 'TWILIO_VERIFY_SERVICE_SID is not configured';
      this.logger.error(msg);
      throw new SomethingWentWrongException(msg);
    }

    try {
      const result = TWILIO_ENABLED ? await this.smsClient.verify.v2
        .services(serviceSid)
        .verificationChecks.create({ to, code }) : { status: code === this.configService.get<string>('MOCK_OTP') ? 'approved': 'rejected' };

      const valid = result.status === 'approved';

      this.logger.log(
        `Verify check for ${to}: status=${result.status}, valid=${valid}`,
      );

      return {
        valid,
        status: result.status, // 'approved' | 'pending' | 'canceled'
      };
    } catch (error: any) {
      const details = `Failed to check verification for ${to}: ${error?.message || error}`;
      this.logger.error(details);
      throw new SomethingWentWrongException(details);
    }
  }
}
