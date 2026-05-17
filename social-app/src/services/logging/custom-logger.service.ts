import { LoggerService } from '@nestjs/common';

const DEFAULT_LOG_LEVEL = LogLevel.INFO;

export class CustomLoggerService implements LoggerService {
  private logLevel: number;

  constructor(private service: string, private path: string) {
    const envLogLevel = (process.env.LOG_LEVEL || DEFAULT_LOG_LEVEL).toUpperCase().trim();
    this.logLevel = LogLevelWeight[envLogLevel] ?? LogLevelWeight[DEFAULT_LOG_LEVEL];
  }

  /**
   * Write a 'log' level log.
   */
  log(message: any) {
    this.logLevel >= LogLevelWeight.INFO && console.info(this.getMessageObject(LogLevel.INFO, message));
  }

  /**
   * Write an 'info' level log.
   */
  info?(message: any) {
    this.logLevel >= LogLevelWeight.INFO && console.info(this.getMessageObject(LogLevel.INFO, message));
  }

  /**
   * Write an 'error' level log.
   */
  error(message: any) {
    this.logLevel >= LogLevelWeight.ERROR && console.error(this.getMessageObject(LogLevel.ERROR, message));
  }

  /**
   * Write a 'warn' level log.
   */
  warn(message: any) {
    this.logLevel >= LogLevelWeight.WARN && console.warn(this.getMessageObject(LogLevel.WARN, message));
  }

  /**
   * Write a 'debug' level log.
   */
  debug?(message: any) {
    this.logLevel >= LogLevelWeight.DEBUG && console.debug(this.getMessageObject(LogLevel.DEBUG, message));
  }

  /**
   * Write a 'verbose' level log.
   */
  verbose?(message: any) {
    this.logLevel >= LogLevelWeight.VERBOSE && console.debug(this.getMessageObject(LogLevel.VERBOSE, message));
  }

  private getMessageObject(logLevel: LogLevel, message: any) {
    // return JSON.stringify({
    //   application: SERVICE,
    //   service: this.service,
    //   path: this.path,
    //   timestamp: new Date().toISOString(),
    //   info: message,
    //   logLevel
    // });
    return [`[${new Date().toISOString()}]`, logLevel, this.service, this.path, JSON.stringify(message)].join(' | ');
  }
}

const enum LogLevel {
  VERBOSE = 'VERBOSE',
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export const LogLevelWeight: Record<LogLevel, number> = {
  [LogLevel.ERROR]: 0,
  [LogLevel.WARN]: 10,
  [LogLevel.INFO]: 20,
  [LogLevel.DEBUG]: 30,
  [LogLevel.VERBOSE]: 1000
};
