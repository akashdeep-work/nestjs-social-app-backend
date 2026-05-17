import { BadRequestException, Controller, Get, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { promises as fsPromises } from 'fs';
import { join } from 'path';

import { Public } from './auth/decorators/public.decorator';

@Public()
@Controller('documents')
export class DocumentController {
  constructor() {}

  /**
   * Social login policy.
   * @returns HTML document.
   */
  @Get('social-login-policy')
  @ApiOperation({ summary: 'Social login policy.' })
  @ApiResponse({ status: 200, description: 'Returns social login policy.' })
  async socialLoginPolicy(@Res() res) {
    try {
      const filePath = join(__dirname, '..', 'src', 'templates', 'social_login_terms.html');
      const htmlContent = await fsPromises.readFile(filePath, 'utf-8');
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlContent);
    } catch (error) {
      throw new BadRequestException('Error loading social login policy');
    }
  }

  /**
   * Privacy policy.
   * @returns HTML document.
   */
  @Get('privacy-policy')
  @ApiOperation({ summary: 'Privacy policy.' })
  @ApiResponse({ status: 200, description: 'Returns privacy policy.' })
  async privacyPolicy(@Res() res) {
    try {
      const filePath = join(__dirname, '..', 'src', 'templates', 'privacy_policy.html');
      const htmlContent = await fsPromises.readFile(filePath, 'utf-8');
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlContent);
    } catch (error) {
      throw new BadRequestException('Error loading privacy policy');
    }
  }

  /**
   * Terms and conditions.
   * @returns HTML document.
   */
  @Get('terms-and-conditions')
  @ApiOperation({ summary: 'Terms and conditions.' })
  @ApiResponse({ status: 200, description: 'Returns terms and conditions.' })
  async termsAndConditions(@Res() res) {
    try {
      const filePath = join(__dirname, '..', 'src', 'templates', 'terms_and_conditions.html');
      const htmlContent = await fsPromises.readFile(filePath, 'utf-8');
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlContent);
    } catch (error) {
      throw new BadRequestException('Error loading terms and conditions');
    }
  }

  /**
   * Delete user policy.
   * @returns HTML document.
   */
  @Get('delete-user-policy')
  @ApiOperation({ summary: 'Delete user policy.' })
  @ApiResponse({ status: 200, description: 'Returns delete user policy.' })
  async socialLoginPolicies(@Res() res) {
    try {
      const filePath = join(__dirname, '..', 'src', 'templates', 'delete_user_policy.html');
      const htmlContent = await fsPromises.readFile(filePath, 'utf-8');
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlContent);
    } catch (error) {
      throw new BadRequestException('Error loading delete user policy');
    }
  }
}
