const AuditLog = require('../models/auditLog');

class AuditLogRepository {
  /**
   * Save an audit log record.
   * @param {Object} logData - { parcelId, action, details }
   * @returns {Promise<Object>} The saved AuditLog document.
   */
  async create(logData) {
    return await AuditLog.create(logData);
  }

  /**
   * Count audit logs by action type.
   * @param {string} action 
   * @returns {Promise<number>}
   */
  async countByAction(action) {
    return await AuditLog.countDocuments({ action });
  }

  /**
   * Find audit logs matching a filter, sorted by timestamp (newest first).
   * @param {Object} filter 
   * @returns {Promise<Array>}
   */
  async findAll(filter = {}) {
    return await AuditLog.find(filter).sort({ timestamp: -1 });
  }

  /**
   * Delete all audit log records.
   * @returns {Promise<Object>}
   */
  async clearAll() {
    return await AuditLog.deleteMany({});
  }
}

module.exports = new AuditLogRepository();
