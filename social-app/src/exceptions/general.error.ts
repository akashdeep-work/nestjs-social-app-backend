import { HttpStatus } from '@nestjs/common';
import { BaseHttpException } from './base-http.exception';

/**
 * GENERIC
 */
export class SomethingWentWrongException extends BaseHttpException {
  constructor(details?: string) {
    super('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR, {
      developer_message: details || '',
      action: 'Check the server side',
    });
  }
}

/**
 * LOGIN EXCEPTIONS
 */
export class InvalidCredentialsException extends BaseHttpException {
  constructor() {
    super(
      'The email or password you entered is incorrect.',
      HttpStatus.UNAUTHORIZED,
      {
        developer_message: 'Incorrect email, or password.',
        action: 'Ask user to re-enter credentials.',
      },
    );
  }
}

export class AccountNotFoundException extends BaseHttpException {
  constructor() {
    super(
      `We couldn't find an account with that information.`,
      HttpStatus.NOT_FOUND,
      {
        developer_message: 'No user exists with the provided credentials.',
        action: 'Suggest sign up or password reset.',
      },
    );
  }
}

export class AccountNotVerifiedException extends BaseHttpException {
  constructor() {
    super(
      'Your account is not verified yet. Please verify it before logging in.',
      HttpStatus.FORBIDDEN,
      {
        developer_message: 'User account not verified by OTP or email.',
        action: 'Redirect to OTP verification screen.',
      },
    );
  }
}

export class LoginServerErrorException extends BaseHttpException {
  constructor() {
    super(
      'Something went wrong. Please try again later.',
      HttpStatus.INTERNAL_SERVER_ERROR,
      {
        developer_message: 'Unexpected server error during login.',
        action: 'Retry or contact support.',
      },
    );
  }
}

/**
 * SIGNUP EXCEPTIONS
 */
export class EmailAlreadyExistsException extends BaseHttpException {
  constructor() {
    super(
      'This email is already registered. Please log in instead.',
      HttpStatus.CONFLICT,
      {
        developer_message: 'The provided email is already registered.',
        action: 'Redirect to login.',
      },
    );
  }
}

export class PhoneAlreadyExistsException extends BaseHttpException {
  constructor() {
    super(
      'This phone number is already registered. Try logging in instead.',
      HttpStatus.CONFLICT,
      {
        developer_message: 'The provided phone number is already registered.',
        action: 'Redirect to login.',
      },
    );
  }
}

export class InvalidEmailFormatException extends BaseHttpException {
  constructor() {
    super('Please enter a valid email address.', HttpStatus.BAD_REQUEST, {
      developer_message: 'Email validation failed.',
      action: 'Ask user to correct input.',
    });
  }
}

export class NonPremiumSignupException extends BaseHttpException {
  constructor() {
    super(
      `You are trying to create a new account, but you don't have premium subscription.`,
      HttpStatus.BAD_REQUEST,
      {
        developer_message: 'Premium subscription required to signup for multiple accounts.',
        action: 'Upgrade plan or use a different mobile number.',
      },
    );
  }
}

export class SignupServerErrorException extends BaseHttpException {
  constructor() {
    super(
      'Something went wrong. Please try again later.',
      HttpStatus.INTERNAL_SERVER_ERROR,
      {
        developer_message: 'Internal error during signup.',
        action: 'Retry signup.',
      },
    );
  }
}

/**
 * VERIFY OTP EXCEPTIONS
 */
export class InvalidOtpException extends BaseHttpException {
  constructor() {
    super('Invalid or expired OTP. Please try again.', HttpStatus.BAD_REQUEST, {
      developer_message: 'OTP code mismatch or expired.',
      action: 'Resend OTP.',
    });
  }
}

export class OtpUserNotFoundException extends BaseHttpException {
  constructor() {
    super(
      `We couldn't find your account. Please sign up again.`,
      HttpStatus.NOT_FOUND,
      {
        developer_message: 'OTP linked user not found.',
        action: 'Redirect to signup.',
      },
    );
  }
}

export class VerifyOtpServerErrorException extends BaseHttpException {
  constructor() {
    super(
      'Unable to verify OTP at the moment.',
      HttpStatus.INTERNAL_SERVER_ERROR,
      {
        developer_message: 'Error verifying OTP.',
        action: 'Retry or contact support.',
      },
    );
  }
}

/**
 * RESEND OTP EXCEPTION
 */
export class OtpLimitReachedException extends BaseHttpException {
  constructor() {
    super(
      'You’ve reached the OTP resend limit. Please wait a few minutes.',
      HttpStatus.TOO_MANY_REQUESTS,
      {
        developer_message: 'Too many OTP requests in short time.',
        action: 'Disable resend temporarily.',
      },
    );
  }
}

/**
 * FORGOT PASSWORD EXCEPTION
 */
export class EmailNotFoundException extends BaseHttpException {
  constructor() {
    super(
      'We couldn’t find an account with that email.',
      HttpStatus.NOT_FOUND,
      {
        developer_message: 'No account found with that email.',
        action: 'Ask user to re-enter or sign up.',
      },
    );
  }
}

/**
 * RESET PASSWORD EXCEPTIONS
 */
export class InvalidResetTokenException extends BaseHttpException {
  constructor() {
    super(
      'Your reset link has expired. Please request a new one.',
      HttpStatus.BAD_REQUEST,
      {
        developer_message: 'Reset token is invalid or expired.',
        action: 'Ask user to reinitiate password reset.',
      },
    );
  }
}

/**
 * CHANGE PASSWORD EXCEPTIONS
 */
export class WrongOldPasswordException extends BaseHttpException {
  constructor() {
    super(
      'The old password you entered is incorrect.',
      HttpStatus.UNAUTHORIZED,
      {
        developer_message: 'User provided incorrect current password.',
        action: 'Ask user to re-enter old password.',
      },
    );
  }
}

export class ChangePasswordServerErrorException extends BaseHttpException {
  constructor() {
    super('Could not change password right now.', HttpStatus.INTERNAL_SERVER_ERROR, {
      developer_message: 'Internal error while changing password.',
      action: 'Retry later.',
    });
  }
}

/**
 * LOGOUT EXCEPTION
 */
export class InvalidLogoutTokenException extends BaseHttpException {
  constructor() {
    super('Your session has already expired.', HttpStatus.UNAUTHORIZED, {
      developer_message: 'User token invalid or expired.',
      action: 'Force logout client-side.',
    });
  }
}

/**
 * SUBSCRIPTION EXCEPTION
 */
export class UnauthorizedSubscriptionAccessException extends BaseHttpException {
  constructor() {
    super(
      'Please log in again to view your subscriptions.',
      HttpStatus.UNAUTHORIZED,
      {
        developer_message:
          'Invalid or missing token while fetching subscriptions.',
        action: 'Redirect to login.',
      },
    );
  }
}

export class SubscriptionNotFoundException extends BaseHttpException {
  constructor() {
    super(
      'Subscription plan not found.',
      HttpStatus.NOT_FOUND,
      {
        developer_message:
          'Invalid subscription id.',
        action: 'Try with different subscription id .',
      },
    );
  }
}

/**
 * REFERRAL EXCEPTIONS
 */
export class InvalidReferralCodeException extends BaseHttpException {
  constructor() {
    super(
      `The referral code you entered doesn't exist or has expired.`,
      HttpStatus.BAD_REQUEST,
      {
        developer_message: 'Invalid referral code used.',
        action: 'Prompt user to enter a valid referral code.',
      },
    );
  }
}

export class SelfReferralException extends BaseHttpException {
  constructor() {
    super(
      'You cannot send referral to self.',
      HttpStatus.BAD_REQUEST,
      {
        developer_message: 'Cannot send referral to self.',
        action: 'Ask user to enter another email.',
      },
    );
  }
}

export class NonPremiumReferralException extends BaseHttpException {
  constructor() {
    super(
      'Premium subscription required to send referrals.',
      HttpStatus.BAD_REQUEST,
      {
        developer_message: 'Premium subscription not found.',
        action: 'Ask user to upgrade plan.',
      },
    );
  }
}

/**
 * GET USER INFO EXCEPTION
 */
export class UserInfoNotFoundException extends BaseHttpException {
  constructor() {
    super(`We couldn't find your account.`, HttpStatus.NOT_FOUND, {
      developer_message: 'No user record found for given email or phone.',
      action: 'Ask user to verify credentials.',
    });
  }
}

/**
 * SOCIAL LOGIN EXCEPTIONS
 */
export class InvalidTokenOrScope extends BaseHttpException {
  constructor() {
    super(
      'Invalid token or scope.',
      HttpStatus.UNAUTHORIZED,
      {
        developer_message: 'Invalid token or scope.',
        action: 'Ask user to send a valid token or scope.',
      },
    );
  }
}