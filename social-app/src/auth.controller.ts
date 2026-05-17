import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBadRequestResponse, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

import { AuthService } from './services/auth.service'
import { Public } from './auth/decorators/public.decorator';
import { MobileTokenDto } from './dto/oauth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  /* --------------------
     WEB FLOW
  -------------------- */

  /**
   * Initiates Google login.
   * @returns Void.
   */
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Initiates Google login.',
    description: 'Initiates Google login by redirecting to login page.'
  })
  @ApiResponse({ status: 200, description: 'Initiates Google login by redirecting to login page', type: Promise<void> })
  @ApiBadRequestResponse({ description: 'Unable to initiate Google login.' })
  async googleLogin() {}

  /**
   * Google login callback, called after successful login.
   * @returns Void.
   */
  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Google login callback, called after successful login.',
    description: 'Google login callback, called after successful login. Redirects to home page.'
  })
  @ApiResponse({ status: 200, description: 'Google login callback, called after successful login. Redirects to home page.', type: Promise<void> })
  @ApiBadRequestResponse({ description: 'Unable to verify Google login.' })
  async googleCallback(@Req() req, @Res() res) {
    const { accessToken } = await this.authService.validateOAuthLogin(req.user);

    return res.redirect(`${this.configService.get<string>('SOCIAL_APP_SERVICE_URL')}/feed?token=${accessToken}`);
  }

  /**
   * Initiates Facebook login.
   * @returns Void.
   */
  @Public()
  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({
    summary: 'Initiates Facebook login.',
    description: 'Initiates Facebook login by redirecting to login page.'
  })
  @ApiResponse({ status: 200, description: 'Initiates Facebook login by redirecting to login page', type: Promise<void> })
  @ApiBadRequestResponse({ description: 'Unable to initiate Facebook login.' })
  async facebookLogin() {}

  /**
   * Facebook login callback, called after successful login.
   * @returns Void.
   */
  @Public()
  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({
    summary: 'Facebook login callback, called after successful login.',
    description: 'Facebook login callback, called after successful login. Redirects to home page.'
  })
  @ApiResponse({ status: 200, description: 'Facebook login callback, called after successful login. Redirects to home page.', type: Promise<void> })
  @ApiBadRequestResponse({ description: 'Unable to verify Facebook login.' })
  async facebookCallback(@Req() req, @Res() res) {
    return this.authService.validateOAuthLogin(req.user);
  }

  /**
   * Initiates LinkedIn login.
   * @returns Void.
   */
  @Public()
  @Get('linkedin')
  @UseGuards(AuthGuard('linkedin'))
  @ApiOperation({
    summary: 'Initiates LinkedIn login.',
    description: 'Initiates LinkedIn login by redirecting to login page.'
  })
  @ApiResponse({ status: 200, description: 'Initiates LinkedIn login by redirecting to login page', type: Promise<void> })
  @ApiBadRequestResponse({ description: 'Unable to initiate LinkedIn login.' })
  async linkedinLogin() {}

  /**
   * LinkedIn login callback, called after successful login.
   * @returns Void.
   */
  @Public()
  @Get('linkedin/callback')
  @UseGuards(AuthGuard('linkedin'))
  @ApiOperation({
    summary: 'LinkedIn login callback, called after successful login.',
    description: 'LinkedIn login callback, called after successful login. Redirects to home page.'
  })
  @ApiResponse({ status: 200, description: 'LinkedIn login callback, called after successful login. Redirects to home page.', type: Promise<void> })
  @ApiBadRequestResponse({ description: 'Unable to verify LinkedIn login.' })
  async linkedinCallback(@Req() req, @Res() res) {
    return this.authService.validateOAuthLogin(req.user);
  }

  /* --------------------
     MOBILE FLOW
  -------------------- */

  /**
   * Google login mobile, called after successful login.
   * @returns Void.
   */
  @Public()
  @Post('mobile/google')
  @ApiOperation({ summary: 'Google login (mobile native SDK)' })
  @ApiBody({ type: MobileTokenDto })
  @ApiResponse({ status: 200, description: 'Returns app JWT' })
  async googleMobileLogin(@Body() body: MobileTokenDto) {
    const userProfile = await this.authService.verifyGoogleToken(body.providerToken);
    return this.authService.validateOAuthLoginMobile(userProfile);
  }

  /**
   * Facebook login mobile, called after successful login.
   * @returns Void.
   */
  @Public()
  @Post('mobile/facebook')
  @ApiOperation({ summary: 'Facebook login (mobile native SDK)' })
  @ApiBody({ type: MobileTokenDto })
  @ApiResponse({ status: 200, description: 'Returns app JWT' })
  async facebookMobileLogin(@Body() body: MobileTokenDto) {
    const userProfile = await this.authService.verifyFacebookToken(body.providerToken);
    return this.authService.validateOAuthLoginMobile(userProfile);
  }

  /**
   * LinkedIn login mobile, called after successful login.
   * @returns Void.
   */
  @Public()
  @Post('mobile/linkedin')
  @ApiOperation({ summary: 'LinkedIn login (mobile native SDK)' })
  @ApiBody({ type: MobileTokenDto })
  @ApiResponse({ status: 200, description: 'Returns app JWT' })
  async linkedinMobileLogin(@Body() body: MobileTokenDto) {
    const userProfile = await this.authService.verifyLinkedinToken(body.providerToken);
    return this.authService.validateOAuthLoginMobile(userProfile);
  }
}
