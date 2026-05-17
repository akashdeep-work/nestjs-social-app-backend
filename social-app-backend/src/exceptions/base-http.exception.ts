import { HttpException, HttpStatus } from '@nestjs/common';

export interface ExceptionDetails {
  developer_message?: string;
  action?: string;
}

export class BaseHttpException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus,
    details?: ExceptionDetails,
  ) {
    super(
      {
        statusCode: status,
        message,
        details: details ?? null,
      },
      status,
    );
  }
}
