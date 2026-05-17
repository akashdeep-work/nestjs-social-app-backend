import { Body, Controller, HttpCode, HttpException, HttpStatus, Post } from '@nestjs/common';
import { AuditLogsService } from './services/logging/audit-logs.service';
import { VerificationService } from './services/verification.service';
import { SendVerificationCodeRequest, VerifyCodeRequest } from './dto/verification-requests';
import { VerificationCodeResponse } from './dto/verification-responses';
import { ApiBadRequestResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IllegalStateError } from './exceptions/illegal-state.error';
import { Public } from './auth/decorators/public.decorator';

@ApiTags('Verification') // Add a tag for better organization in Swagger UI
@Controller('/verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService, private readonly auditLogsService: AuditLogsService) {}

  /**
   * Send verification code.
   * @returns Verification response.
   */
  @Public()
  @Post('/send')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Send verification code.',
    description: 'Send verification code to user email or phone number.'
  })
  @ApiResponse({ status: 200, description: 'Send verification code to user email or phone number.', type: VerificationCodeResponse })
  @ApiBadRequestResponse({ description: 'Unable to send verification code' })
  public async sendVerificationCode(@Body() request: SendVerificationCodeRequest ): Promise<VerificationCodeResponse> {
    const logEventPayload = {};
    this.auditLogsService.createLogEvent(
      this.auditLogsService.getAuditLogParams(
        'default',
        'sendVerificationCode',
        'Send verification code',
        'POST'
      ),
      JSON.stringify(logEventPayload)
    );
    try {
      return await this.verificationService.sendVerificationCode(request);
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
   * Verify the verification code.
   * @returns Verification response.
   */
  @Public()
  @Post('/verify')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Verify the verification code.',
    description: 'Verify the verification code.'
  })
  @ApiResponse({ status: 200, description: 'Verify the verification code.', type: VerificationCodeResponse })
  @ApiBadRequestResponse({ description: 'Unable to verify the verification code' })
  public async verifyVerificationCode(@Body() request: VerifyCodeRequest ): Promise<VerificationCodeResponse> {
    const logEventPayload = {};
    this.auditLogsService.createLogEvent(
      this.auditLogsService.getAuditLogParams(
        'default',
        'verifyVerificationCode',
        'Verify the verification code',
        'POST'
      ),
      JSON.stringify(logEventPayload)
    );
    try {
      return await this.verificationService.verifyVerificationCode(request);
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
