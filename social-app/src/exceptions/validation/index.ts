export class ValidationError extends Error {
  /**
   * Optional payload associated with the error.
   */
  errorDetails?: any;

  constructor(message: string, errorDetails?: any) {
    super(message);
    this.name = 'ValidationError';
    this.errorDetails = errorDetails;

    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class UserNotFoundError extends ValidationError {
  constructor(username: string) {
    super(`User "${username}" not found`, { username });
  }
}
