import { HttpException, HttpStatus } from '@nestjs/common';

export class InternalServerError extends HttpException {
  constructor() {
    super(
      {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error'
      },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}
