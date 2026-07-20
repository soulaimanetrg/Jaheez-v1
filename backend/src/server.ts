import { createServer } from 'http';
import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { redis } from './redis/redis';
import { attachSocketServer } from './features/realtime/socket.server';
import { startDriverHeartbeatWorker } from './workers/driverHeartbeat.worker';
import { startDispatchWorker } from './workers/dispatch.worker';
import { startReconciliationWorker } from './workers/reconciliation.worker';
import { startCommissionRetryWorker } from './workers/commissionRetry.worker';

const server = createServer(app);
const io = attachSocketServer(server);
const heartbeatWorker = startDriverHeartbeatWorker(io);
const dispatchWorker = startDispatchWorker(io);
const reconciliationWorker = startReconciliationWorker();
const commissionRetryWorker = startCommissionRetryWorker();

server.listen(env.PORT, () => {
  logger.info(`JAHEEZ backend running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

const shutdown = async () => {
  logger.info('Shutting down JAHEEZ backend gracefully...');
  clearInterval(heartbeatWorker);
  clearInterval(dispatchWorker);
  clearInterval(reconciliationWorker);
  clearInterval(commissionRetryWorker);

  // Close Socket.IO server first to terminate open connections
  try {
    io.close();
    logger.info('Socket.IO server closed.');
  } catch (err) {
    logger.error('Error closing Socket.IO:', err);
  }

  // Force close any remaining sockets if closeAllConnections is supported
  if (typeof server.closeAllConnections === 'function') {
    server.closeAllConnections();
  }

  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      if (redis) {
        await redis.quit();
        logger.info('Redis client disconnected.');
      }
    } catch (err) {
      logger.error('Error disconnecting Redis:', err);
    }
    logger.info('Graceful shutdown complete. Exiting.');
    process.exit(0);
  });

  // Fallback timeout to ensure we exit
  setTimeout(() => {
    logger.warn('Force shutting down due to timeout');
    process.exit(1);
  }, 3000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
