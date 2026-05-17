import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { HttpMethod, SERVICE } from 'src/helpers/constants';
import { CustomLoggerService } from 'src/services/logging/custom-logger.service';
import { AxiosResponse } from 'axios';
import { SomethingWentWrongException } from 'src/exceptions/general.error';
import { GeoData } from 'src/dto/geo.responses';

@Injectable()
export class GeoService {
  private readonly logger = new CustomLoggerService(SERVICE, GeoService.name);
  private readonly IP_WHO_ENDPOINT: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    const envIpWhoEndpoint = this.configService.get('IP_WHO_ENDPOINT') || '';
    this.IP_WHO_ENDPOINT = envIpWhoEndpoint.endsWith('/')
      ? envIpWhoEndpoint.substring(0, envIpWhoEndpoint.length - 1)
      : envIpWhoEndpoint;
  }

  /**
   * Get geo data from IP WHO API.
   * @param ip - IP address to look for.
   * @returns Geo data from IP WHO API.
   */
  public async getGeoDataFromIp(ip: string): Promise<GeoData> {
    this.logger.log({ method: 'getGeoDataFromIp', params: { ip } });
    try {
      const response = await this.getIpWhoApiResponse(HttpMethod.GET, `/${ip}`);
      const { latitude: lat, longitude: lon, city, region, country } = response.data;
      
      return { lat: Number(lat), lon: Number(lon), city, region, country };
    } catch (error) {
        const details = `Error making request to GeoService: ${error.message}`;
        this.logger.error({method: 'getGeoDataFromIp', message: details});

        throw new SomethingWentWrongException(details);
    }
  }

  /**
   * Execute an HTTP GET or POST request to the IP WHO API Service and return its response
   */
  private async getIpWhoApiResponse(httpMethod: HttpMethod, endpoint: string, payload?: object): Promise<AxiosResponse> {
    const url = `${this.IP_WHO_ENDPOINT}` + endpoint;
    const config = { headers: this.getAuthorizationHeaders() };

    switch (httpMethod) {
      case HttpMethod.GET:
        return firstValueFrom(this.httpService.get(url, config));
      case HttpMethod.POST:
        return firstValueFrom(this.httpService.post(url, payload, config));
      default:
        throw new SomethingWentWrongException(`Unsupported HTTP method: ${httpMethod}`);
    }
  }

  /**
   * Generate HTTP request headers for authorizing the requests to IP WHO API Service
   */
  private getAuthorizationHeaders() {
    return {
      Accept: '*/*'
    };
  }
}