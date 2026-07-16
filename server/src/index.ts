import { createServer, Server } from 'http';
import app from './app';
import config from './config/config';
import logger from './config/logger';
import prisma from './config/prisma';
import { startScheduler } from './config/scheduler';
import { initSocket } from './config/socket';

let server: Server;

prisma.$connect()
  .then(() => {
    logger.info('Connected to PostgreSQL database');
    // Bọc app Express trong HTTP server "trần" để Socket.IO gắn vào CÙNG cổng (dùng lại listen bên dưới).
    server = createServer(app);
    initSocket(server);
    server.listen(config.port, () => {
      logger.info(`Listening to port ${config.port}`);
      if (config.env === 'development') {
        logger.info(`Swagger API Documentation available at: http://localhost:${config.port}/v1/docs`);
      }
      // Bật job nền SAU khi đã nghe cổng: DB đã sẵn sàng và Render đã thấy service "live"
      startScheduler();
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
