const logger = require('../config/logger');

/**
 * Handle user login with demo credentials.
 * Demo Credentials:
 *   Username: admin
 *   Password: admin123
 */
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Username and password are required.' }
      });
    }

    // Check credentials against demo account
    if (username.trim() === 'admin' && password === 'admin123') {
      logger.info(`User '${username}' logged in successfully.`);
      return res.status(200).json({
        success: true,
        data: {
          username: 'admin',
          token: 'demo-routing-token-xyz'
        }
      });
    }

    logger.warn(`Failed login attempt for user: '${username}'`);
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid username or password.' }
    });
  } catch (error) {
    logger.error('Login controller error', { error: error.stack });
    return next(error);
  }
};
