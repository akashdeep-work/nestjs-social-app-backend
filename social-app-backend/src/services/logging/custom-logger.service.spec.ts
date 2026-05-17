import resetAllMocks = jest.resetAllMocks;
import restoreAllMocks = jest.restoreAllMocks;
import { CustomLoggerService, LogLevelWeight } from './custom-logger.service';

describe('custom-logger-service', () => {
  const TEST_SERVICE = 'test-service';
  const TEST_CLASS = 'test-class';

  let env: typeof process.env;

  beforeEach(async () => {
    resetAllMocks();
    env = { ...process.env };
    jest.useFakeTimers().setSystemTime(1516242422000);
  });

  afterEach(async () => {
    jest.useRealTimers();
    process.env = env;
    restoreAllMocks();
  });

  describe('log', () => {
    const message = 'info test message';
    let infoMock: jest.SpyInstance;

    beforeEach(async () => {
      infoMock = jest.spyOn(console, 'info').mockImplementation(jest.fn());
    });

    ['ERROR', 'WARN'].forEach(LOG_LEVEL =>
      it(`should not log anything for LOG_LEVEL=${LOG_LEVEL}`, () => {
        process.env.LOG_LEVEL = LOG_LEVEL;

        const customLoggerService = new CustomLoggerService(TEST_SERVICE, TEST_CLASS);
        expect(customLoggerService['logLevel']).toEqual(LogLevelWeight[LOG_LEVEL]);

        customLoggerService.log(message);

        expect(infoMock).toHaveBeenCalledTimes(0);
      })
    );

    ['INFO', undefined, 'DEBUG', 'VERBOSE'].forEach(LOG_LEVEL =>
      it(`should call console.info ${LOG_LEVEL ? `for LOG_LEVEL=${LOG_LEVEL}` : `for default settings`}`, () => {
        if (LOG_LEVEL) {
          process.env.LOG_LEVEL = LOG_LEVEL;
        } else {
          expect(process.env.LOG_LEVEL).toBe(undefined);
        }

        const customLoggerService = new CustomLoggerService(TEST_SERVICE, TEST_CLASS);
        expect(customLoggerService['logLevel']).toEqual(LogLevelWeight[LOG_LEVEL ?? 'INFO']);

        customLoggerService.log(message);

        expect(infoMock).toHaveBeenCalledTimes(1);
        expect(infoMock).toHaveBeenCalledWith(expect.stringMatching(`.*${message}.*`));
        expect(infoMock).toHaveBeenCalledWith(expect.stringMatching(`.*${TEST_SERVICE}.*`));
        expect(infoMock).toHaveBeenCalledWith(expect.stringMatching(`.*${TEST_CLASS}.*`));
        expect(infoMock).toHaveBeenCalledWith(expect.stringMatching('.*INFO.*'));
      })
    );
  });

  describe('error', () => {
    const message = 'error test message';
    let errorMock: jest.SpyInstance;

    beforeEach(async () => {
      errorMock = jest.spyOn(console, 'error').mockImplementation(jest.fn());
    });

    ['ERROR', 'WARN', 'INFO', undefined, 'DEBUG', 'VERBOSE'].forEach(LOG_LEVEL =>
      it(`should call console.error ${LOG_LEVEL ? `for LOG_LEVEL=${LOG_LEVEL}` : `for default settings`}`, () => {
        if (LOG_LEVEL) {
          process.env.LOG_LEVEL = LOG_LEVEL;
        } else {
          expect(process.env.LOG_LEVEL).toBe(undefined);
        }

        const customLoggerService = new CustomLoggerService(TEST_SERVICE, TEST_CLASS);
        expect(customLoggerService['logLevel']).toEqual(LogLevelWeight[LOG_LEVEL ?? 'INFO']);

        customLoggerService.error(message);

        expect(errorMock).toHaveBeenCalledTimes(1);
        expect(errorMock).toHaveBeenCalledWith(expect.stringMatching(`.*${message}.*`));
        expect(errorMock).toHaveBeenCalledWith(expect.stringMatching(`.*${TEST_SERVICE}.*`));
        expect(errorMock).toHaveBeenCalledWith(expect.stringMatching(`.*${TEST_CLASS}.*`));
        expect(errorMock).toHaveBeenCalledWith(expect.stringMatching('.*ERROR.*'));
      })
    );
  });

  describe('warn', () => {
    const message = 'warn test message';
    let warnMock: jest.SpyInstance;

    beforeEach(async () => {
      warnMock = jest.spyOn(console, 'warn').mockImplementation(jest.fn());
    });

    it(`should not log anything for LOG_LEVEL=ERROR`, () => {
      process.env.LOG_LEVEL = 'ERROR';

      const customLoggerService = new CustomLoggerService(TEST_SERVICE, TEST_CLASS);
      expect(customLoggerService['logLevel']).toEqual(LogLevelWeight['ERROR']);

      customLoggerService.warn(message);

      expect(warnMock).toHaveBeenCalledTimes(0);
    });

    ['WARN', 'INFO', undefined, 'DEBUG', 'VERBOSE'].forEach(LOG_LEVEL =>
      it(`should call console.warn ${LOG_LEVEL ? `for LOG_LEVEL=${LOG_LEVEL}` : `for default settings`}`, () => {
        if (LOG_LEVEL) {
          process.env.LOG_LEVEL = LOG_LEVEL;
        } else {
          expect(process.env.LOG_LEVEL).toBe(undefined);
        }

        const customLoggerService = new CustomLoggerService(TEST_SERVICE, TEST_CLASS);
        expect(customLoggerService['logLevel']).toEqual(LogLevelWeight[LOG_LEVEL ?? 'INFO']);

        customLoggerService.warn(message);

        expect(warnMock).toHaveBeenCalledTimes(1);
        expect(warnMock).toHaveBeenCalledWith(expect.stringMatching(`.*${message}.*`));
        expect(warnMock).toHaveBeenCalledWith(expect.stringMatching(`.*${TEST_SERVICE}.*`));
        expect(warnMock).toHaveBeenCalledWith(expect.stringMatching(`.*${TEST_CLASS}.*`));
        expect(warnMock).toHaveBeenCalledWith(expect.stringMatching('.*WARN.*'));
      })
    );
  });

  describe('info', () => {
    const message = 'info test message';
    let infoMock: jest.SpyInstance;

    beforeEach(async () => {
      infoMock = jest.spyOn(console, 'info').mockImplementation(jest.fn());
    });

    ['ERROR', 'WARN'].forEach(LOG_LEVEL =>
      it(`should not log anything for LOG_LEVEL=${LOG_LEVEL}`, () => {
        process.env.LOG_LEVEL = LOG_LEVEL;

        const customLoggerService = new CustomLoggerService(TEST_SERVICE, TEST_CLASS);
        expect(customLoggerService['logLevel']).toEqual(LogLevelWeight[LOG_LEVEL]);

        customLoggerService.info(message);

        expect(infoMock).toHaveBeenCalledTimes(0);
      })
    );

    ['INFO', undefined, 'DEBUG', 'VERBOSE'].forEach(LOG_LEVEL =>
      it(`should call console.info ${LOG_LEVEL ? `for LOG_LEVEL=${LOG_LEVEL}` : `for default settings`}`, () => {
        if (LOG_LEVEL) {
          process.env.LOG_LEVEL = LOG_LEVEL;
        } else {
          expect(process.env.LOG_LEVEL).toBe(undefined);
        }

        const customLoggerService = new CustomLoggerService(TEST_SERVICE, TEST_CLASS);
        expect(customLoggerService['logLevel']).toEqual(LogLevelWeight[LOG_LEVEL ?? 'INFO']);

        customLoggerService.info(message);

        expect(infoMock).toHaveBeenCalledTimes(1);
        expect(infoMock).toHaveBeenCalledWith(expect.stringMatching(`.*${message}.*`));
        expect(infoMock).toHaveBeenCalledWith(expect.stringMatching(`.*${TEST_SERVICE}.*`));
        expect(infoMock).toHaveBeenCalledWith(expect.stringMatching(`.*${TEST_CLASS}.*`));
        expect(infoMock).toHaveBeenCalledWith(expect.stringMatching('.*INFO.*'));
      })
    );
  });

  describe('debug', () => {
    const message = 'debug test message';
    let debugMock: jest.SpyInstance;

    beforeEach(async () => {
      debugMock = jest.spyOn(console, 'debug').mockImplementation(jest.fn());
    });

    ['ERROR', 'WARN', 'INFO', undefined].forEach(LOG_LEVEL =>
      it(`should not log anything ${LOG_LEVEL ? `for LOG_LEVEL=${LOG_LEVEL}` : `for default settings`}`, () => {
        if (LOG_LEVEL) {
          process.env.LOG_LEVEL = LOG_LEVEL;
        } else {
          expect(process.env.LOG_LEVEL).toBe(undefined);
        }

        const customLoggerService = new CustomLoggerService(TEST_SERVICE, TEST_CLASS);
        expect(customLoggerService['logLevel']).toEqual(LogLevelWeight[LOG_LEVEL ?? 'INFO']);

        customLoggerService.debug(message);

        expect(debugMock).toHaveBeenCalledTimes(0);
      })
    );

    ['DEBUG', 'VERBOSE'].forEach(LOG_LEVEL =>
      it(`should call console.debug for LOG_LEVEL=${LOG_LEVEL}`, () => {
        process.env.LOG_LEVEL = LOG_LEVEL;

        const customLoggerService = new CustomLoggerService(TEST_SERVICE, TEST_CLASS);
        expect(customLoggerService['logLevel']).toEqual(LogLevelWeight[LOG_LEVEL]);

        customLoggerService.debug(message);

        expect(debugMock).toHaveBeenCalledTimes(1);
        expect(debugMock).toHaveBeenCalledWith(expect.stringMatching(`.*${message}.*`));
        expect(debugMock).toHaveBeenCalledWith(expect.stringMatching(`.*${TEST_SERVICE}.*`));
        expect(debugMock).toHaveBeenCalledWith(expect.stringMatching(`.*${TEST_CLASS}.*`));
        expect(debugMock).toHaveBeenCalledWith(expect.stringMatching('.*DEBUG.*'));
      })
    );
  });

  describe('verbose', () => {
    const message = 'verbose test message';
    let debugMock: jest.SpyInstance;

    beforeEach(async () => {
      debugMock = jest.spyOn(console, 'debug').mockImplementation(jest.fn());
    });

    [undefined, 'ERROR', 'WARN', 'INFO', 'DEBUG'].forEach(LOG_LEVEL =>
      it(`should not log anything ${LOG_LEVEL ? `for LOG_LEVEL=${LOG_LEVEL}` : `for default settings`}`, () => {
        if (LOG_LEVEL) {
          process.env.LOG_LEVEL = LOG_LEVEL;
        } else {
          expect(process.env.LOG_LEVEL).toBe(undefined);
        }

        const customLoggerService = new CustomLoggerService(TEST_SERVICE, TEST_CLASS);
        expect(customLoggerService['logLevel']).toEqual(LogLevelWeight[LOG_LEVEL ?? 'INFO']);

        customLoggerService.verbose(message);

        expect(debugMock).toHaveBeenCalledTimes(0);
      })
    );

    it('should call console.debug for LOG_LEVEL=VERBOSE', () => {
      process.env.LOG_LEVEL = 'VERBOSE';

      const customLoggerService = new CustomLoggerService(TEST_SERVICE, TEST_CLASS);
      expect(customLoggerService['logLevel']).toEqual(LogLevelWeight['VERBOSE']);

      customLoggerService.verbose(message);

      expect(debugMock).toHaveBeenCalledTimes(1);
      expect(debugMock).toHaveBeenCalledWith(expect.stringMatching(`.*${message}.*`));
      expect(debugMock).toHaveBeenCalledWith(expect.stringMatching(`.*${TEST_SERVICE}.*`));
      expect(debugMock).toHaveBeenCalledWith(expect.stringMatching(`.*${TEST_CLASS}.*`));
      expect(debugMock).toHaveBeenCalledWith(expect.stringMatching('.*VERBOSE.*'));
    });
  });
});
