import { Controller, Get, HttpCode, HttpException, HttpStatus, Post, Query } from '@nestjs/common';
import { AuditLogsService } from './services/logging/audit-logs.service';
import { ApiBadRequestResponse, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IllegalStateError } from './exceptions/illegal-state.error';
import { HIBPService } from './services/hibp.service';
import { GetBreachedAccount } from './dto/hibp-requests';
import { BreachInfo } from './dto/hibp.responses';

@ApiTags('HIBP') // Add a tag for better organization in Swagger UI
@ApiBearerAuth()
@Controller('/hibp')
export class HIBPController {
  constructor(
    private readonly hibpService: HIBPService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  /**
   * Get breach info for an email.
   * @returns A list of breaches.
   */
  @Get('/check-email')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Get breach info for an email.',
    description: 'Get breach info for an email from HIBP service'
  })
  @ApiResponse({ status: 200, description: 'Get breach info for an email.', type: BreachInfo })
  @ApiBadRequestResponse({ description: 'Unable to fetch breach info' })
  public async checkEmailForBreach(@Query() request: GetBreachedAccount ): Promise<Array<BreachInfo>> {
    const logEventPayload = {};
    this.auditLogsService.createLogEvent(
      this.auditLogsService.getAuditLogParams(
        'default',
        'checkEmailForBreach',
        'Get breach info for an email.',
        'GET'
      ),
      JSON.stringify(logEventPayload)
    );
    try {
      const { email } = request;

      return await this.hibpService.checkEmailForBreach(email);
    } catch (error) {
      if (error instanceof IllegalStateError) {
        throw new HttpException(
          {
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            error: error
          },
          HttpStatus.UNPROCESSABLE_ENTITY
        );
      }
      throw error; // Re-throw other errors
    }
  }
}
