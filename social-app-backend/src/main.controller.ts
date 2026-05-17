import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AuditLogsService } from './services/logging/audit-logs.service';

@Controller()
export class MainController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  public getHealthCheck(): string {
    return "It's alive\n";
  }
}
