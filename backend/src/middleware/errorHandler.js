const logger = require('../config/logger');
const Sentry = require('@sentry/node');

module.exports = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. Capture exception with Sentry if Sentry is initialized
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }

  // 2. Structured logger record using Winston (only show stack traces for internal server 5xx errors)
  const logMetadata = {
    statusCode,
    url: req.originalUrl,
    method: req.method,
    body: req.path === '/api/auth/login' && req.body ? { ...req.body, password: '[REDACTED]' } : req.body
  };

  if (statusCode >= 500) {
    logMetadata.stack = err.stack;
  }

  logger.error(`Exception occurred: ${err.message} [Status: ${statusCode}]`, logMetadata);

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
