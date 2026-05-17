import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { HttpService } from '@nestjs/axios';

import { SERVICE } from 'src/helpers/constants';
import { CustomLoggerService } from './logging/custom-logger.service';
import { SomethingWentWrongException } from 'src/exceptions/general.error';
import { AnomalousLoginResponse } from 'src/dto/anomaly-detector.responses';
import { LoginEvent } from 'src/dto/anomaly-detector-requests';
import { GeoService } from './geo.service';
import { NotificationService } from './notification.service';
import { Types } from 'mongoose';

@Injectable()
export class AnomalyDetectionService {
  private readonly logger = new CustomLoggerService(SERVICE, AnomalyDetectionService.name);
  private ANOMALY_DETECTOR_SERVICE_URL: string;
  private RISK_THRESHOLD = 5;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly geoService: GeoService,
    private readonly notificationService: NotificationService,
  ) {
    this.ANOMALY_DETECTOR_SERVICE_URL = this.configService.get('ANOMALY_DETECTOR_SERVICE_URL');
  }

  private summarizeResult(event: AnomalousLoginResponse): string {
    try{
      const {
        factors,
        risk_level,
      } = event;

      const factorsText = factors.map(f => `- ${f.factor}`).join('\n');
      const message = `Risk: ${risk_level.toUpperCase()}\nFactors:\n${factorsText}`

      return message;
    }
    catch(error){
      const details = `Error while summarizing results: ${error.message}`;
      this.logger.error(details);

      throw new SomethingWentWrongException(details);
    }
  }

  async checkAnomaly(event: LoginEvent): Promise<AnomalousLoginResponse> {
    try{
      const {
        userId,
        ip,
        deviceId,
        userAgent,
        isFailedAttempt
      } = event;
      
      const geo = await this.geoService.getGeoDataFromIp(ip); // optional

      const paylod = {
        userId,
        ip,
        geo: { lat: geo.lat, lon: geo.lon },
        deviceId,
        userAgent,
        isFailedAttempt,
        timestamp: new Date().toISOString(),
      };

      const res = await this.getAnomalyServiceResponse(
        'POST',
        'check-login',
        paylod
      );

      return res.data;
    }
    catch(error){
      const details = `Error while checking anomaly: ${error.message}`;
      this.logger.error(details);

      throw new SomethingWentWrongException(details);
    }
  }

  async sendSuspiciousLoginAlert(event: LoginEvent): Promise<void> {
    try{
      const anomalyResult = await this.checkAnomaly(event);
      const summary = this.summarizeResult(anomalyResult);

      const payload = {
        userId: new Types.ObjectId(event.userId),
        title: 'Suspicious Login Detected!',
        body: summary,
        data: anomalyResult
      };

      if(Number(anomalyResult.risk_score) > this.RISK_THRESHOLD)
        await this.notificationService.dispatchNotification(payload);

      return;
    }
    catch(error){
      const details = `Error while sending login alert: ${error.message}`;
      this.logger.error(details);

      throw new SomethingWentWrongException(details);
    }
  }

  /**
   * Execute an HTTP request to the Anomaly Detector Service and return its response
   */
  private async getAnomalyServiceResponse(httpMethod: string, endpoint: string, payload: object): Promise<AxiosResponse> {
    const url = `${this.ANOMALY_DETECTOR_SERVICE_URL}/${endpoint}`;
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
