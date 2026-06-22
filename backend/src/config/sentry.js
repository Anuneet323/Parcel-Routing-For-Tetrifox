const Sentry = require('@sentry/node');
const logger = require('./logger');

/**
 * Initialize Sentry on the Express app
 */
const initSentry = (app) => {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.info('Sentry environment variable (SENTRY_DSN) is absent. Running without external monitoring.');
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 1.0,
    });
    
    // Express middlewares for Sentry profiling and tracing
    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());
    
    logger.info('Sentry crash reporting and APM initialized.');
  } catch (err) {
    logger.error('Failed Sentry SDK initialization: ', { error: err.message });
  }
};

/**
 * Register Sentry error handler on the Express app
 * Must be registered after controllers but before the custom error middleware.
 */
const setupSentryErrorHandler = (app) => {
  if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.errorHandler());
  }
};

module.exports = {
  initSentry,
  setupSentryErrorHandler
};
