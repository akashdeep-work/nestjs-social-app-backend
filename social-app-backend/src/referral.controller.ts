import { Body, Controller, HttpCode, HttpException, HttpStatus, Post } from '@nestjs/common';
import { AuditLogsService } from './services/logging/audit-logs.service';
import { ReferralService } from './services/referral.service';
import { SendReferralCodeRequest, ValidateReferralCodeRequest } from './dto/referral-requests';
import { SendReferralCodeResponse, ValidateReferralCodeResponse } from './dto/referral-responses';
import { ApiBadRequestResponse, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IllegalStateError } from './exceptions/illegal-state.error';
import { CurrentUser } from './auth/decorators/current-user.decorator';

@ApiTags('Referral') // Add a tag for better organization in Swagger UI
@ApiBearerAuth()
@Controller('/referrals')
export class ReferralController {
  constructor(private readonly referralService: ReferralService, private readonly auditLogsService: AuditLogsService) {}

  /**
   * Send referral code.
   * @returns Send referral response.
   */
  @Post('/send')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Send referral code.',
    description: 'Send referral code to user email.'
  })
  @ApiResponse({ status: 200, description: 'Send referral code to user email.', type: SendReferralCodeResponse })
  @ApiBadRequestResponse({ description: 'Unable to send referral code' })
  public async sendReferralCode(
    @Body() request: SendReferralCodeRequest,
    @CurrentUser() user: any
  ): Promise<SendReferralCodeResponse> {
    const logEventPayload = {};
    this.auditLogsService.createLogEvent(
      this.auditLogsService.getAuditLogParams(
        'default',
        'sendReferralCode',
        'Send referral code',
        'POST'
      ),
      JSON.stringify(logEventPayload)
    );
    try {
      return await this.referralService.sendReferralCode(request, user);
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

  /**
   * Send referral code.
   * @returns Send referral response.
   */
  @Post('/validate')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Validate referral code.',
    description: 'Validate referral code.'
  })
  @ApiResponse({ status: 200, description: 'Validate referral code.', type: ValidateReferralCodeResponse })
  @ApiBadRequestResponse({ description: 'Unable to validate referral code' })
  public async validateReferralCode(
    @Body() request: ValidateReferralCodeRequest,
    @CurrentUser() user: any
  ): Promise<ValidateReferralCodeResponse> {
    const logEventPayload = {};
    this.auditLogsService.createLogEvent(
      this.auditLogsService.getAuditLogParams(
        'default',
        'validateReferralCode',
        'Validate referral code',
        'POST'
      ),
      JSON.stringify(logEventPayload)
    );
    try {
      return await this.referralService.validateReferralCode(request.code, user.email);
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
