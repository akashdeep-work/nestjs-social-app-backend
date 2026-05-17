/**
 * Custom error class representing an illegal state in the application.
 */
export class IllegalStateError extends Error {
  /**
   * Optional payload associated with the error.
   */
  errorDetails?: any;

  /**
   * Creates an instance of IllegalStateError.
   * @param message A description of the illegal state.
   * @param errorDetails Optional payload associated with the error.
   */
  constructor(message: string, errorDetails?: any) {
    super(message);
    this.name = 'IllegalStateError';
    this.errorDetails = errorDetails;

    // Set the prototype explicitly
    Object.setPrototypeOf(this, IllegalStateError.prototype);
  }
}
