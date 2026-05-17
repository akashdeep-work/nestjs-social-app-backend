import { Injectable } from '@nestjs/common';

@Injectable()
export class Helper {
  constructor() {}

  public extractUserIDFromRequest(request: any) {
    // this should be populated by api-gateway's interceptor.
    return request.username ?? request.user?.username;
  }
}
