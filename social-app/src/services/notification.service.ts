import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { HttpService } from '@nestjs/axios';

import { SERVICE } from 'src/helpers/constants';
import { CustomLoggerService } from './logging/custom-logger.service';
import { SomethingWentWrongException } from 'src/exceptions/general.error';
import { DispatchNotificationRequest, RegisterDeviceRequest } from 'src/dto/notification-requests';
import { DispatchNotificationResponse, RegisterDeviceResponse } from 'src/dto/notification-response';

@Injectable()
export class NotificationService {
  private readonly logger = new CustomLoggerService(SERVICE, NotificationService.name);
  private NOTIFICATION_SERVICE_URL: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService
  ) {
    this.NOTIFICATION_SERVICE_URL = this.configService.get('NOTIFICATION_SERVICE_URL');
  }

  async registerDevice(event: RegisterDeviceRequest): Promise<RegisterDeviceResponse> {
    try{
      const {
        userId,
        token,
        type,
        primary,
        metadata
      } = event;

      const paylod = {
        userId,
        token,
        type,
        primary,
        metadata
      };

      const res = await this.getNotificationServiceResponse(
        'POST',
        'notifications/devices',
        paylod
      );

      return res.data;
    }
    catch(error){
      const details = `Error while registering device for notifications: ${error.message}`;
      this.logger.error(details);

      throw new SomethingWentWrongException(details);
    }
  }

  async dispatchNotification(event: DispatchNotificationRequest): Promise<DispatchNotificationResponse> {
    try{
      const {
        userId,
        title,
        body,
        data
      } = event;

      const paylod = {
        userId,
        title,
        body,
        data
      };

      const res = await this.getNotificationServiceResponse(
        'POST',
        'notifications/send',
        paylod
      );

      return res.data;
    }
    catch(error){
      const details = `Error while sending notification: ${error.message}`;
      this.logger.error(details);

      throw new SomethingWentWrongException(details);
    }
  }

  /**
   * Execute an HTTP request to the Notification Service and return its response
   */
  private async getNotificationServiceResponse(httpMethod: string, endpoint: string, payload: object): Promise<AxiosResponse> {
    const url = `${this.NOTIFICATION_SERVICE_URL}/${endpoint}`;
    const config = {};

    switch (httpMethod) {
      case 'GET':
        return firstValueFrom(this.httpService.get(url, config));
      case 'POST':
        return firstValueFrom(this.httpService.post(url, payload, config));
      default:
        throw new SomethingWentWrongException(`Unsupported HTTP method: ${httpMethod}`);
    }
  }
}
