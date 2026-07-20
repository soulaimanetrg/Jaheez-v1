import winston from 'winston';
import { env } from './env';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  env.NODE_ENV === 'development'
    ? winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.printf(
          (info) => `[${info.timestamp}] ${info.level}: ${info.message}`
        )
      )
    : winston.format.combine(
        winston.format.metadata({ fillWith: ['timestamp', 'level', 'message'] }),
        winston.format.json()
      )
);

const transports = [
  new winston.transports.Console(),
];

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels,
  format,
  transports,
});
