const logger = require('../config/logger');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn(`Unauthorized API access attempt from IP ${req.ip} - Missing token`);
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required. Please log in.' }
      });
    }

    const token = authHeader.split(' ')[1];
    // Match against our demo authentication token
    if (token !== 'demo-routing-token-xyz') {
      logger.warn(`Unauthorized API access attempt from IP ${req.ip} - Invalid token`);
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or expired session token.' }
      });
    }

    // Token is valid, proceed
    next();
  } catch (error) {
    logger.error('Authentication middleware error', { error: error.stack });
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error during authentication.' }
    });
  }
};
