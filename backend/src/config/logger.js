const winston = require('winston');
const path = require('path');

// Define log level
const level = process.env.LOG_LEVEL || 'info';

// Define formats
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaString}`;
  })
);

// Create logger
const logger = winston.createLogger({
  level,
  format: jsonFormat,
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/error.log'), 
      level: 'error' 
    }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/combined.log') 
    })
  ]
});

// If we are in development, also log to the console with colorized formats
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
} else {
  // Production console logs should also be JSON structured for log aggregators (e.g. Datadog, GCP Logs)
  logger.add(new winston.transports.Console({
    format: jsonFormat
  }));
}

module.exports = logger;
