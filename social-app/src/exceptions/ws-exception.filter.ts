import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { SOCKET_EVENTS } from 'src/helpers/constants';

@Catch(WsException)
export class WsExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: WsException, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();
    const error = exception.getError();
    const message = typeof error === 'string' ? error : (error as any)?.message ?? 'Unexpected websocket error';

    this.logger.warn(`WS exception for socket ${client.id}: ${message}`);
    client.emit(SOCKET_EVENTS.SOCKET_ERROR, {
      message,
      timestamp: new Date().toISOString()
    });
  }
}
