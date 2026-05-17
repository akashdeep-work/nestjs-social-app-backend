import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Post, Query } from '@nestjs/common';
import { AuditLogsService } from './services/logging/audit-logs.service';
import { SubscriptionService } from './services/subscription.service';
import { FetchSubscriptionPlans, SubscribeToPlan } from './dto/subscription-requests';
import { SubscribedPlan, SubscriptionPlans } from './dto/subscription-responses';
import { ApiBadRequestResponse, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IllegalStateError } from './exceptions/illegal-state.error';
import { CurrentUser } from './auth/decorators/current-user.decorator';

@ApiTags('Subscriptions') // Add a tag for better organization in Swagger UI
@ApiBearerAuth()
@Controller('/subscription')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  /**
   * Fetch subscription plans.
   * @returns A list Subscription plans.
   */
  @Get('/list')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Fetch subscription plans.',
    description: 'Fetch a list of available subscription plans.'
  })
  @ApiResponse({ status: 200, description: 'Fetch a list of available subscription plans.', type: SubscriptionPlans })
  @ApiBadRequestResponse({ description: 'Unable to fetch subscription plans' })
  public async fetchSubscriptionPlans(@Query() request: FetchSubscriptionPlans ): Promise<SubscriptionPlans> {
    const logEventPayload = {};
    this.auditLogsService.createLogEvent(
      this.auditLogsService.getAuditLogParams(
        'default',
        'fetchSubscriptionPlans',
        'Fetch subscription plans',
        'GET'
      ),
      JSON.stringify(logEventPayload)
    );
    try {
      const plans = await this.subscriptionService.fetchSubscriptionPlans(request);

      return { plans }
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
   * Subscribe to a billing plan.
   * @returns Subscribed billing plan.
   */
  @Post('/subscribe')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Subscribe to a billing plan.',
    description: 'Upgrade or subscribe to a billing plan.'
  })
  @ApiResponse({ status: 200, description: 'Subscribed billing plan.', type: SubscribedPlan })
  @ApiBadRequestResponse({ description: 'Unable to subscribe to plan' })
  public async subscribeToPlan(
    @Body() request: SubscribeToPlan,
    @CurrentUser() user: any
  ): Promise<SubscribedPlan> {
    const logEventPayload = {};
    this.auditLogsService.createLogEvent(
      this.auditLogsService.getAuditLogParams(
        'default',
        'subscribeToPlan',
        'Subscribe to a billing plan',
        'POST'
      ),
      JSON.stringify(logEventPayload)
    );
    try {
      const plan = await this.subscriptionService.subscribeToPlan(request, user.email);

      return { plan }
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
