import { long } from 'aws-sdk/clients/cloudfront';
import { IsNotEmpty } from 'class-validator';

export class AuditLogsData {
  @IsNotEmpty()
  logGroupName: string;
  @IsNotEmpty()
  logStreamName: string;
  @IsNotEmpty()
  logEvents: CloudWatchAuditLogEvent[];
}

export class CloudWatchAuditLogEvent {
  @IsNotEmpty()
  service: string;
  @IsNotEmpty()
  userId: string;
  description: string;
  @IsNotEmpty()
  method: string;
  payload: string;
  @IsNotEmpty()
  timestamp: long;
}
