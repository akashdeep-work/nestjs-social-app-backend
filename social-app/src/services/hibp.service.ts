import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { HttpMethod, SERVICE } from 'src/helpers/constants';
import { CustomLoggerService } from 'src/services/logging/custom-logger.service';
import { AxiosResponse } from 'axios';
import { BreachInfo } from 'src/dto/hibp.responses';
import { SomethingWentWrongException } from 'src/exceptions/general.error';

@Injectable()
export class HIBPService {
  private readonly logger = new CustomLoggerService(SERVICE, HIBPService.name);
  private readonly HIBP_API_KEY: string;
  private readonly HIBP_USER_AGENT: string;
  private readonly HIBP_ENDPOINT: string;

  constructor(private readonly httpService: HttpService, private readonly configService: ConfigService) {
    this.HIBP_API_KEY = this.configService.get('HIBP_API_KEY');
    this.HIBP_USER_AGENT = this.configService.get('HIBP_USER_AGENT');
    const envHibpEndpoint = this.configService.get('HIBP_ENDPOINT');
    this.HIBP_ENDPOINT = envHibpEndpoint.endsWith('/')
      ? envHibpEndpoint.substring(0, envHibpEndpoint.length - 1)
      : envHibpEndpoint;
  }

  /**
   * Get breach information information from HIBP API.
   * @param email - Email ID to get information for.
   * @returns An array of object containing breach information from HIBP API.
   */
  public async checkEmailForBreach(email: string): Promise<Array<BreachInfo>> {
    this.logger.log({ method: 'checkEmailForBreach', params: { email } });
    try {
      const response = await this.getHibpApiResponse(HttpMethod.GET, `/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`);

      return response.data;
    } catch (error) {
        if (error.response?.status === 404) {
            this.logger.log({ method: 'checkEmailForBreach', message: 'No breaches found' });
            return [];
        }
        const details = `Error making request to HIBPService: ${error.message}`;

        this.logger.error({
            method: 'checkEmailForBreach',
            message: details
        });
        throw new SomethingWentWrongException(details);
    }
  }

  /**
   * Execute an HTTP GET or POST request to the HIBP API Service and return its response
   */
  private async getHibpApiResponse(httpMethod: HttpMethod, endpoint: string, payload?: object): Promise<AxiosResponse> {
    const url = `${this.HIBP_ENDPOINT}/api/v3` + endpoint;
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
   * Generate HTTP request headers for authorizing the requests to HIBP API Service
   */
  private getAuthorizationHeaders() {
    return {
      Accept: '*/*',
      'hibp-api-key': this.HIBP_API_KEY,
      'user-agent': this.HIBP_USER_AGENT ?? 'NestJS-HIBP-Integration/1.0'
    };
  }
}

