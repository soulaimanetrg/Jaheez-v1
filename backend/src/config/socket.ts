import { ServerOptions } from 'socket.io';
import { corsOptions } from './cors';

export const socketOptions: Partial<ServerOptions> = {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
};
