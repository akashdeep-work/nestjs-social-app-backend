import { Injectable } from '@nestjs/common';
import { CustomLoggerService } from './custom-logger.service';
import { ConfigService } from '@nestjs/config';
import { SERVICE } from '../../helpers/constants';

@Injectable()
export class AuditLogsService {
  private LOG_GROUP_NAME = 'audit-logs';
  private LOG_STREAM_NAME = 'social-app-backend';
  private useLocalConsole = false;

  private readonly logger = new CustomLoggerService(SERVICE, AuditLogsService.name);

  constructor(
    private readonly configService: ConfigService
  ) {
    this.useLocalConsole = Boolean(this.configService.get<boolean>('USE_LOCAL_CONSOLE_FOR_AUDIT'));
    this.logger.log({ useLocalConsole: this.useLocalConsole });
  }

  getAuditLogParams(userId, action, description, method) {
    return {
      userId: userId,
      action: action || '',
      application: 'social-app-backend',
      description: description || '',
      method: method || 'GET',
      timestamp: new Date().getTime()
    };
  }

  createLogEvent(logEventParms, logEventPayload) {
    const logEvent = {
      logGroupName: this.LOG_GROUP_NAME,
      logStreamName: this.LOG_STREAM_NAME,
      logEvents: [
        {
          service: SERVICE,
          userId: logEventParms.userId,
          action: logEventParms.action,
          description: logEventParms.description,
          method: logEventParms.method,
          timestamp: logEventParms.timestamp,
          payload: logEventPayload
        }
      ]
    };
    return this.logger.log(logEvent);
    // ToDo: Added logging service for AWS/Azure
  }
}
