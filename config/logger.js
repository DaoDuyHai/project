import pino from 'pino';
import { env } from './env.js';

const isProduction = env.NODE_ENV === 'production';
const isTest = env.NODE_ENV === 'test';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isTest ? 'silent' : 'info'),
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
  transport:
    !isProduction && !isTest
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});

export default logger;
