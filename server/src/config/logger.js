import winston from 'winston';
import { env } from './env.js';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const customFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
  return `[${timestamp}] [${level}]: ${stack || message} ${metaStr}`.trim();
});

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    env.NODE_ENV === 'production' ? json() : customFormat
  ),
  transports: [
    new winston.transports.Console({
      format: env.NODE_ENV === 'production' 
        ? json() 
        : combine(colorize(), timestamp({ format: 'HH:mm:ss' }), customFormat),
    }),
  ],
});

export default logger;
