import app from './app';
import config from './config/config';
import logger from './config/logger';
import prisma from './config/prisma';
import { Server } from 'http';

let server: Server;

prisma.$connect()
  .then(() => {
    logger.info('Connected to PostgreSQL database');
    server = app.listen(config.port, () => {
      logger.info(`Listening to port ${config.port}`);
      if (config.env === 'development') {
        logger.info(`Swagger API Documentation available at: http://localhost:${config.port}/v1/docs`);
      }
    });
  })
  .catch((error) => {
    logger.error('Failed to connect to database:', error);
    process.exit(1);
  });

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error: unknown) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});
