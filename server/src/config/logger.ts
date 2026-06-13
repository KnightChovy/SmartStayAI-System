import winston from 'winston';
import config from './config';

const enumerateErrorFormat = winston.format((info) => {
  if (info instanceof Error) {
    Object.assign(info, { message: info.stack });
  }
  return info;
});

// Shared line format: "2026-06-05 10:00:00 info: message"
const lineFormat = winston.format.combine(
  enumerateErrorFormat(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
);

const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  transports: [
    // Console: colorized in development for readability
    new winston.transports.Console({
      stderrLevels: ['error'],
      format: winston.format.combine(
        config.env === 'development' ? winston.format.colorize() : winston.format.uncolorize(),
        lineFormat
      ),
    }),
    // File: every log line (no colors)
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(winston.format.uncolorize(), lineFormat),
    }),
    // File: errors only, for quick triage
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(winston.format.uncolorize(), lineFormat),
    }),
  ],
});

export default logger;
