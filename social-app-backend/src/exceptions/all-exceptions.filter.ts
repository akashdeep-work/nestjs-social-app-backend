import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { throwError } from 'rxjs';
import { CustomLoggerService } from '../services/logging/custom-logger.service';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private logExceptionStack = false;

  constructor(private readonly logger: CustomLoggerService, private readonly configService: ConfigService) {
    this.logExceptionStack = Boolean(this.configService.get<boolean>('LOG_EXCEPTION_STACK'));
  }

  private static obfuscateKeys = ['password', 'newPassword', 'newPasswordConfirmation'];

  catch(exception: any, host: ArgumentsHost) {
    this.logger.error({
      method: 'AllExceptionsFilter',
      message: this.buildLogMessage(host, exception)
    });
    if (host && host.getType() === 'http') {
      // Handle HTTP exceptions
      const ctx = host.switchToHttp();
      const response = ctx.getResponse();
      const status = exception.status || HttpStatus.INTERNAL_SERVER_ERROR;

      if (exception instanceof HttpException && exception.getStatus() === 422) {
        response.status(exception.getStatus()).json({
          statusCode: status,
          content: exception.getResponse()
        });
      } else {
        response.status(status).json({
          statusCode: status,
          message: exception.message || exception.response
        });
      }
    } else {
      return throwError(() => exception);
    }
  }

  private static obfuscate(params: any) {
    if (params) {
      Object.keys(params).forEach(key => {
        if (AllExceptionsFilter.obfuscateKeys.includes(key)) {
          params[key] = '**********';
        }
      });
    }
  }

  private buildLogMessage(host: ArgumentsHost, exception: any) {
    let errorMesssage = exception.message;
    if (exception.response !== undefined && exception.response.message !== undefined) {
      errorMesssage += ' ' + JSON.stringify(exception.response.message);
    }
    return {
      pattern: AllExceptionsFilter.getPattern(host),
      requestParameters: AllExceptionsFilter.getRequestParameters(host),
      error: errorMesssage,
      stack: this.logExceptionStack ? exception.stack : '',
      statusCode: exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    };
  }

  /**
   * This method is used to get the pattern from the ArgumentsHost. It's hopefully handles with tcp and http protocols.
   * @param host ArgumentsHost object
   * @returns Pattern
   */
  private static getPattern(host: ArgumentsHost): string {
    //TODO: REMOVE TCP PROTOCOL - i.e. remove TCP part
    if (host && host.getType() === 'http') {
      const request: Request = host.switchToHttp().getRequest();
      return request?.url || 'default-pattern'; // Return a default pattern if the request or URL is not available.
    } else {
      const pattern = host.getArgByIndex(1)?.getPattern(); // Using optional chaining to handle possible undefined value
      if (pattern) {
        return pattern;
      }
    }
  }

  /**
   * This method is used to get the request parameters from the ArgumentsHost. It's hopefully handles with tcp and http protocols.
   *
   * @param host ArgumentsHost object.
   * @description If the ArgumentsHost is not HTTP context, this method will try to get the parameters from the first argument of the ArgumentsHost.
   * @description If the ArgumentsHost is not HTTP context and the first argument is not available, this method will return null or handle the fallback as needed.
   *
   * @returns RequestParameters
   */
  private static getRequestParameters(host: ArgumentsHost): any {
    //TODO: REMOVE TCP PROTOCOL - i.e. remove TCP part
    if (host && host.getType() === 'http') {
      // HTTP context - access query and body parameters.
      const request: Request = host.switchToHttp().getRequest();
      if (request) {
        const queryParams = request.query; // Access query parameters.
        const bodyParams = request.body; // Access body parameters.

        AllExceptionsFilter.obfuscate(queryParams);
        AllExceptionsFilter.obfuscate(bodyParams);

        return {
          query: queryParams,
          body: bodyParams
        };
      }
    } else {
      // TCP context or non-HTTP context.
      const parameters = host.getArgByIndex(0);
      AllExceptionsFilter.obfuscate(parameters);
      if (parameters) {
        return parameters;
      }
    }

    // If both methods failed or returned falsy values, return null or handle the fallback as needed.
    return null;
  }
}
