import type { TransformFnParams } from 'class-transformer';
import { ISO_8601_DATE_REGEX, ISO_8601_DATE_TIME_REGEX } from '../constants';

export const ToDate = ({ value }: TransformFnParams) => {
  if (!value) return undefined;
  try {
    // Validate ISO format before transforming
    if (typeof value !== 'string') return value;
    if (ISO_8601_DATE_REGEX.test(value)) return new Date(`${value}T00:00:00.000Z`);
    if (ISO_8601_DATE_TIME_REGEX.test(value)) return new Date(value);

    return value;
  } catch (error) {
    return value; // Will fail validation
  }
};
