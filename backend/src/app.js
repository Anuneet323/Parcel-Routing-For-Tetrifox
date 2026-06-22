const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initSentry, setupSentryErrorHandler } = require('./config/sentry');
const logger = require('./config/logger');
const parcelRoutes = require('./routes/parcelRoutes');
const authRoutes = require('./routes/authRoutes');
const auth = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// 1. Sentry initialization (Needs to be the first middleware)
initSentry(app);

// 2. Security Middlewares
app.use(helmet());

// Configure CORS
const allowedOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Apply Rate Limiter to prevent DOS / brute force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again after 15 minutes.',
      statusCode: 429
    }
  }
});
app.use('/api/', limiter);

// 3. Body Parsing Middleware (with size restrictions to protect against large payloads)
app.use(express.json({ limit: '1mb' }));

// 4. Request & Response Logging Middleware (excl. IP and user-agent metadata)
app.use((req, res, next) => {
  // Capture request body (mask credentials on login for security)
  const reqBody = req.path === '/api/auth/login' && req.body
    ? { ...req.body, password: '[REDACTED]' }
    : req.body;

  // Intercept json send method to log response payload
  const originalJson = res.json;
  let responseBody;
  res.json = function (body) {
    responseBody = body;
    return originalJson.apply(res, arguments);
  };

  res.on('finish', () => {
    // Only log metadata for routes inside the /api scope or non-health checkers
    if (req.path.startsWith('/api')) {
      const logData = {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        requestBody: reqBody,
        responseBody: responseBody
      };

      if (res.statusCode >= 400) {
        logger.error(`API Call failed: ${req.method} ${req.path} [Status: ${res.statusCode}]`, logData);
      } else {
        logger.info(`API Call succeeded: ${req.method} ${req.path} [Status: ${res.statusCode}]`, logData);
      }
    }
  });

  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// 5. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/parcels', auth, parcelRoutes);

// Catch-all route handler (404)
app.use((req, res, next) => {
  const err = new Error(`Resource not found: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
});

// 6. Sentry Error Handler (Must be registered before custom error handlers)
setupSentryErrorHandler(app);

// 7. Centralized Custom Error Handler (Catches all bubbled exceptions)
app.use(errorHandler);

module.exports = app;
