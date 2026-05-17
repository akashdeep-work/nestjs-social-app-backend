import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { firstValueFrom } from 'rxjs';
import { CustomLoggerService } from 'src/services/logging/custom-logger.service';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  let service: AllExceptionsFilter;
  const mockAppLoggerService = {
    warn: jest.fn(),
    error: jest.fn(),
    verbose: jest.fn(),
    log: jest.fn()
  };

  mockAppLoggerService['path'] = 'test';

  const mockGetConfig = jest.fn();
  const mockConfigService = {
    get: mockGetConfig
  };

  const mockJson = jest.fn();
  const mockStatus = jest.fn().mockImplementation(() => ({
    json: mockJson
  }));
  const mockGetResponse = jest.fn().mockImplementation(() => ({
    status: mockStatus,
    json: jest.fn()
  }));
  const mockHttpArgumentsHost = jest.fn().mockImplementation(() => ({
    getResponse: mockGetResponse,
    getRequest: jest.fn().mockReturnValue({
      url: '/test',
      query: { someParam: 'someValue' },
      body: { someParam: 'someValue' }
    })
  }));

  const mockArgumentsHost = {
    switchToHttp: mockHttpArgumentsHost,
    getArgByIndex: jest.fn().mockImplementation(
      x =>
        (x === 0 && {
          notToObfuscate: 'test',
          password: '123456',
          newPassword: '123456789',
          newPasswordConfirmation: '123456789'
        }) ||
        (x === 1 && { getPattern: jest.fn().mockReturnValue('test') })
    ),
    getArgs: jest.fn(),
    getType: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn()
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [
        AllExceptionsFilter,
        {
          provide: CustomLoggerService,
          useValue: mockAppLoggerService
        },
        {
          provide: ConfigService,
          useValue: mockConfigService
        }
      ]
    }).compile();

    service = module.get<AllExceptionsFilter>(AllExceptionsFilter);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('catch', () => {
    it('Http exception', () => {
      const exception = new HttpException('HttpException', HttpStatus.BAD_REQUEST);
      const error = service.catch(exception, mockArgumentsHost);

      expect(mockArgumentsHost.getArgByIndex).toBeCalledTimes(2);
      expect(mockAppLoggerService.error).toBeCalledTimes(1);

      firstValueFrom(error).catch(exceptionReturned => {
        expect(exceptionReturned).toBe(exception);
      });
    });

    it('Other exception', () => {
      const rpcException = new RpcException('RpcException');
      const error = service.catch(rpcException, mockArgumentsHost);

      expect(mockArgumentsHost.getArgByIndex).toBeCalledTimes(2);
      expect(mockAppLoggerService.error).toBeCalledTimes(1);

      firstValueFrom(error).catch(exceptionReturned => {
        expect(exceptionReturned).toBe(rpcException);
      });
    });

    it('should catch and log HttpException', () => {
      const exception = new Error();

      mockArgumentsHost.getType.mockReturnValue('http');

      service.catch(exception, mockArgumentsHost);

      expect(mockArgumentsHost.switchToHttp).toBeCalledTimes(3);
      expect(mockAppLoggerService.error).toBeCalledTimes(1);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should catch and log RpcException even when getArgByIndex is undefined', () => {
      const rpcException = new RpcException('RpcException');

      const mockArgumentsHost = {
        switchToHttp: jest.fn(),
        getArgByIndex: jest.fn().mockImplementation(() => undefined),
        getArgs: jest.fn(),
        getType: jest.fn().mockReturnValue('rcp'),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn()
      };

      const error = service.catch(rpcException, mockArgumentsHost);

      expect(mockAppLoggerService.error).toBeCalledTimes(1);

      firstValueFrom(error).catch(exceptionReturned => {
        expect(exceptionReturned).toBe(rpcException);
      });
    });

    it('should catch and log HttpException even when url is not present on getRequest', () => {
      const exception = new HttpException('HttpException', HttpStatus.BAD_REQUEST);

      const mockArgumentsHost = {
        switchToHttp: jest.fn().mockImplementation(() => ({
          getResponse: mockGetResponse,
          getRequest: jest.fn().mockReturnValue({})
        })),
        getArgByIndex: jest.fn().mockImplementation(() => undefined),
        getArgs: jest.fn(),
        getType: jest.fn().mockReturnValue('http'),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn()
      };

      service.catch(exception, mockArgumentsHost);
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);

      mockArgumentsHost.switchToHttp.mockImplementation(() => ({
        getResponse: mockGetResponse,
        getRequest: jest.fn().mockReturnValue(null)
      }));
      service.catch(exception, mockArgumentsHost);
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);

      expect(mockAppLoggerService.error).toBeCalledTimes(2);
    });
  });
});
