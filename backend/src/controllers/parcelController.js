const routingService = require('../services/routingService');
const logger = require('../config/logger');

/**
 * Route a single parcel.
 * Receives validated body directly from validate middleware.
 */
exports.routeSingleParcel = async (req, res, next) => {
  try {
    const parcel = await routingService.routeParcel(req.validatedBody);
    
    return res.status(201).json({
      success: true,
      data: {
        id: parcel._id,
        weight: parcel.weight,
        value: parcel.value,
        destinationCountry: parcel.destinationCountry,
        department: parcel.department,
        matchedRule: parcel.matchedRule,
        status: parcel.status,
        createdAt: parcel.createdAt
      }
    });
  } catch (err) {
    logger.error('Failed routing single parcel in controller', { error: err.stack, input: req.body });
    return next(err);
  }
};

/**
 * Route a batch of parcels.
 * Receives validated array directly from validate middleware.
 */
exports.routeBatchParcels = async (req, res, next) => {
  try {
    const batchResults = await routingService.routeBatch(req.validatedBody);

    return res.status(200).json({
      success: true,
      data: batchResults
    });
  } catch (err) {
    logger.error('Failed batch parcel uploads in controller', { error: err.stack });
    return next(err);
  }
};

/**
 * Get dashboard stats for visualization.
 * Queries statistics through the service.
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const stats = await routingService.getDashboardStats();
    
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    logger.error('Failed gathering dashboard statistics in controller', { error: err.stack });
    return next(err);
  }
};

/**
 * Get parcels list, optionally filtered by status or department.
 */
exports.getParcels = async (req, res, next) => {
  try {
    const { status, department } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (department) filter.department = department;

    const parcels = await routingService.getParcels(filter);
    return res.status(200).json({
      success: true,
      data: parcels
    });
  } catch (err) {
    logger.error('Failed retrieving parcels in controller', { error: err.stack });
    return next(err);
  }
};

/**
 * Get system routing error logs.
 */
exports.getErrors = async (req, res, next) => {
  try {
    const errors = await routingService.getErrors();
    return res.status(200).json({
      success: true,
      data: errors
    });
  } catch (err) {
    logger.error('Failed retrieving system errors in controller', { error: err.stack });
    return next(err);
  }
};

/**
 * Reset dashboard stats to zero (wipes all records).
 */
exports.resetStats = async (req, res, next) => {
  try {
    await routingService.resetStats();
    logger.info('Database records cleared. Dashboard stats reset to zero.');
    return res.status(200).json({
      success: true,
      message: 'Dashboard statistics have been reset to zero successfully.'
    });
  } catch (err) {
    logger.error('Failed resetting stats in controller', { error: err.stack });
    return next(err);
  }
};

