import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { socketOptions } from '../../config/socket';
import { logger } from '../../config/logger';
import { RealtimePrincipal, RealtimeService } from './realtime.service';

declare module 'socket.io' {
  interface Socket {
    principal?: RealtimePrincipal;
  }
}

let ioInstance: Server | null = null;

export function getSocketIO(): Server | null {
  return ioInstance;
}

export function attachSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, socketOptions);
  ioInstance = io;
  const realtime = new RealtimeService();

  io.use(async (socket, next) => {
    try {
      const headerToken = socket.handshake.headers.authorization?.toString().replace(/^Bearer\s+/i, '');
      const token = socket.handshake.auth?.token || headerToken;
      const actor = socket.handshake.auth?.actor || socket.handshake.auth?.kind;
      if (!token) {
        throw new Error('missing_socket_token');
      }
      if (!actor || !['customer', 'driver', 'admin'].includes(actor)) {
        throw new Error('unknown_actor_type');
      }
      socket.principal = await realtime.verifyToken(String(token), String(actor));
      next();
    } catch (error) {
      logger.warn('[socket] Authentication rejected', { error: error instanceof Error ? error.message : error });
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    logger.info('[socket] Client connected', { id: socket.id, principal: socket.principal?.kind });

    socket.on('join_room', async (room: string, ack?: (result: { ok: boolean; error?: string }) => void) => {
      try {
        const allowed = socket.principal ? await realtime.canJoinRoom(socket.principal, room) : false;
        if (!allowed) {
          logger.warn('[socket] Room join rejected', { socketId: socket.id, room, principal: socket.principal });
          ack?.({ ok: false, error: 'forbidden_room' });
          return;
        }
        await socket.join(room);
        ack?.({ ok: true });
      } catch (error) {
        logger.error('[socket] Room join failed', { room, error: error instanceof Error ? error.message : error });
        ack?.({ ok: false, error: 'join_failed' });
      }
    });

    socket.on('leave_room', async (room: string) => {
      await socket.leave(room);
    });
  });

  return io;
}
