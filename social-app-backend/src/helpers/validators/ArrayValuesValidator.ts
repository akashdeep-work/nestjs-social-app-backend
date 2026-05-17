import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'ArrayValuesValidator', async: false })
export class ArrayValuesValidator<T = any> implements ValidatorConstraintInterface {
  validate(values: Array<T>, args: ValidationArguments): boolean {
    const allowedValues = args.constraints as Array<T>; // Get the allowed values from constraints
    return Array.isArray(values) && values.every(value => allowedValues.includes(value));
  }

  defaultMessage(args: ValidationArguments): string {
    const allowedValues = args.constraints;
    return `Each value in the array must be one of the following: ${allowedValues.join(', ')}`;
  }
}
