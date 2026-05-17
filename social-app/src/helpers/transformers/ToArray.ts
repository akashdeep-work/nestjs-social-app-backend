import type { TransformFnParams } from 'class-transformer';
import { asArray } from '../array';

export const ToArray = (property: TransformFnParams) => {
  if (!property) return undefined;

  return asArray(property.value);
};
