// Load environment variables if dotenv is installed
try {
  require('dotenv').config();
} catch (e) {
  // Silent catch if dotenv is not used/installed yet
}

const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./config/logger');
const routingService = require('./services/routingService');
const { rulesConfigSchema } = require('./validators/ruleValidator');

// 1. Load rules configuration file
let rulesConfig;
try {
  rulesConfig = require('./config/rules.json');
} catch (err) {
  logger.error('CRITICAL: Failed to load routing rules configuration file. Startup prevented.', {
    error: err.message
  });
  process.exit(1);
}

// 2. Validate rules configuration at startup using Joi
const { error, value: validatedRules } = rulesConfigSchema.validate(rulesConfig, {
  abortEarly: false,
  allowUnknown: false
});

if (error) {
  logger.error('CRITICAL: Invalid routing rules configuration detected. Startup prevented.', {
    validationErrors: error.details.map(d => ({
      path: d.path.join('.'),
      message: d.message,
      value: d.context.value
    }))
  });
  // Terminate application immediately with non-zero exit code
  process.exit(1);
}

// 3. Initialize routing service with validated rules
routingService.initialize(validatedRules);
logger.info('Routing rule config validation succeeded. Service initialized.');

// 4. Connect to MongoDB and start HTTP Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = () => {
      logger.info('Shutting down server gracefully...');
      server.close(() => {
        logger.info('HTTP server closed.');
        const mongoose = require('mongoose');
        mongoose.connection.close(false, () => {
          logger.info('Database connections closed.');
          process.exit(0);
        });
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`, { error: err.stack });
    process.exit(1);
  }
};

startServer();
