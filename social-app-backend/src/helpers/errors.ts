export const enum CommonErrors {
  SOMETHING_WENT_WRONG = `Something went wrong.`,
  USER_NOT_FOUND = `User not found.`,
  UNVERIFIED_PASSWORD_RESET = `Password reset code not verified.`,
  VERIFICATION_CODE_EXPIRED = `Verification code expired.`,
}

export const enum SignupErrors {
  NEW_ACCOUNT_ERROR = `You are trying to create a new account, but you don't have premium subscription.`,
  EMAIL_EXISTS = `This email is already registered. Please try a different one.`,
  UNVERIFIED_EMAIL = `This email is not verified.`,
  UNVERIFIED_PHONE = `This phone number is not verified.`
}

export const enum LoginErrors {
  INCORRECT_CODE = `Incorrect verification code.`,
  INVALID_CREDENTIALS = `Invalid credentials.`
}

export const enum ReferralErrors {
  NOT_SUBSCRIBED = `Premium subscription required to send referrals.`,
  INVALID_REFERRAL = `Invalid referral code.`,
  REFERRAL_EXPIRED = `Referral code expired.`,
  REFERRAL_USED = `Referral code already used.`,
  INVALID_LINK = `Invalid or expired referral link.`,
  SELF_REFERRAL = `Cannot send referral to self.`
}