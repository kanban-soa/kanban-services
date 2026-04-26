import 'dotenv/config';
import app from './index';
import config from './config/env';
import { logger } from './lib/logger';

const server = app.listen(config.port, () => {
  logger.info('Gateway service started', { port: config.port, env: config.nodeEnv });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

