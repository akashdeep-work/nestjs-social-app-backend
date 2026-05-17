import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { ISO_8601_DATE_REGEX, ISO_8601_DATE_TIME_REGEX } from 'src/helpers/constants';

@ValidatorConstraint({ name: 'isValidDate', async: false })
export class IsValidDate implements ValidatorConstraintInterface {
  validate(value: string | Date | undefined) {
    if (value === undefined) return true; // Skip if Date is not provided

    if (typeof value === 'string') {
      return ISO_8601_DATE_REGEX.test(value) || ISO_8601_DATE_TIME_REGEX.test(value);
    } else if (value instanceof Date) {
      return value.toString() !== 'Invalid Date';
    }

    return false;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a valid ISO 8601 date string`;
  }
}
