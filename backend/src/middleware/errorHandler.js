const logger = require('../config/logger');
const Sentry = require('@sentry/node');

module.exports = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. Capture exception with Sentry if Sentry is initialized
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }

  // 2. Structured logger record using Winston
  logger.error(`Exception occurred: ${err.message} [Status: ${statusCode}]`, {
    statusCode,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    // Avoid logging passwords or sensitive tokens if they exist, but OK to log weight/value parameters
    body: req.body,
    stack: err.stack
  });

  // 3. Client response sanitization - NEVER send stack trace to client
  return res.status(statusCode).json({
    success: false,
    error: {
      message: statusCode === 500 && isProduction
        ? 'A system error occurred. Please contact administrator.'
        : err.message,
      statusCode
    }
  });
};
