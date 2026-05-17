import { Socket } from 'socket.io';
import { JwtDecodedPayload } from 'src/auth/schemas/jwt.schema';

export type AuthenticatedSocket = Socket & {
  user: JwtDecodedPayload;
};
