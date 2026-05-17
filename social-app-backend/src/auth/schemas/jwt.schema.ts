import { Types } from 'mongoose';

export class JwtDecodedPayload {
  _id?: Types.ObjectId | string;
  sub?: Types.ObjectId | string;
  email: string;
}
