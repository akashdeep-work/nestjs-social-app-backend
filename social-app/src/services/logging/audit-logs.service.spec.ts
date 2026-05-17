import { Test, TestingModule } from '@nestjs/testing';
import { validate } from 'class-validator';
import { AuditLogsData } from '../../interfaces/audit-logs/dto/audit-logs.interface';
import { AuditLogsService } from './audit-logs.service';
import resetAllMocks = jest.resetAllMocks;
import { ConfigService } from '@nestjs/config';

describe('UsersService', () => {
  let auditLogsService: AuditLogsService;

  const mockConfigService = {
    get: jest.fn()
  };

  beforeEach(async () => {
    resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogsService,
        {
          provide: ConfigService,
          useValue: mockConfigService
        }
      ]
    }).compile();

    auditLogsService = module.get<AuditLogsService>(AuditLogsService);
  });

  it('should be defined', () => {
    expect(auditLogsService).toBeDefined();
  });

  it('validate auditlogs dto', async () => {
    const logEvent = new AuditLogsData();
    logEvent.logGroupName = undefined;
    logEvent.logStreamName = undefined;
    logEvent.logEvents = undefined;

    const errors = await validate(logEvent);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should send message and returns true', async () => {
    const userId = 'userIdTest';
    const action = 'actionTest';
    const description = 'descriptionTest';
    const method = 'methodTest';
    const getAuditLogParams = auditLogsService.getAuditLogParams(userId, action, description, method);

    const payload = { payload: 'payloadTest' };

    const createLogEventResult = await auditLogsService.createLogEvent(getAuditLogParams, payload);

    const payloadTest = {
      logEvents: [
        {
          action: 'actionTest',
          description: 'descriptionTest',
          method: 'methodTest',
          payload: { payload: 'payloadTest' },
          service: 'social-app-backend',
          timestamp: getAuditLogParams.timestamp,
          userId: 'userIdTest'
        }
      ],
      logGroupName: 'audit-logs',
      logStreamName: 'social-app-backend'
    };

    expect(createLogEventResult).toEqual(true);
  });

  it('should replace empty parameters when calling getAuditLogParams and returns true', async () => {
    const userId = 'userIdTest';
    const action = undefined;
    const description = undefined;
    const method = undefined;
    const getAuditLogParams = auditLogsService.getAuditLogParams(userId, action, description, method);

    const payload = { payload: 'payloadTest' };

    const createLogEventResult = await auditLogsService.createLogEvent(getAuditLogParams, payload);

    const payloadTest = {
      logEvents: [
        {
          action: '',
          description: '',
          method: 'GET',
          payload: { payload: 'payloadTest' },
          service: 'social-app-backend',
          timestamp: getAuditLogParams.timestamp,
          userId: 'userIdTest'
        }
      ],
      logGroupName: 'audit-logs',
      logStreamName: 'social-app-backend'
    };

    expect(createLogEventResult).toEqual(true);
  });

  it('should send message and returns false', async () => {
    const userId = 'userIdTest';
    const action = 'actionTest';
    const description = 'descriptionTest';
    const method = 'methodTest';
    const getAuditLogParams = auditLogsService.getAuditLogParams(userId, action, description, method);

    const payload = { payload: 'payloadTest' };

    console.error = jest.fn();
    await auditLogsService.createLogEvent(getAuditLogParams, payload);

    const payloadTest = {
      logEvents: [
        {
          action: 'actionTest',
          description: 'descriptionTest',
          method: 'methodTest',
          payload: { payload: 'payloadTest' },
          service: 'social-app-backend',
          timestamp: getAuditLogParams.timestamp,
          userId: 'userIdTest'
        }
      ],
      logGroupName: 'audit-logs',
      logStreamName: 'social-app-backend'
    };

    expect(console.error).toHaveBeenCalledTimes(1);
  });
});
