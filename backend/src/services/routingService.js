const { RuleRegistry } = require('../rules/ruleEngine');
const parcelRepository = require('../repositories/parcelRepository');
const auditLogRepository = require('../repositories/auditLogRepository');
const logger = require('../config/logger');

class RoutingService {
  constructor() {
    this.registry = new RuleRegistry();
  }

  /**
   * Initialize the service by loading routing rules.
   * @param {Array<Object>} rulesConfig 
   */
  initialize(rulesConfig) {
    this.registry.loadRules(rulesConfig);
  }

  /**
   * Route a single parcel.
   * @param {Object} parcelData - { weight, value, destinationCountry }
   * @returns {Promise<Object>} The saved Parcel document.
   */
  async routeParcel(parcelData) {
    try {
      // Match the rule using the registry
      const matchedRule = this.registry.matchRule(parcelData);
      
      let routingResult;
      if (matchedRule) {
        routingResult = {
          department: matchedRule.action.department || null,
          status: matchedRule.action.status,
          matchedRule: matchedRule.name
        };
      } else {
        // Default fallback if no rules match (acts as a safety net)
        routingResult = {
          department: null,
          status: 'PENDING_INSURANCE_APPROVAL',
          matchedRule: 'Default Fallback (Insurance Required)'
        };
      }

      // Save Parcel to the database via Repository
      const parcel = await parcelRepository.create({
        weight: parcelData.weight,
        value: parcelData.value,
        destinationCountry: parcelData.destinationCountry,
        department: routingResult.department,
        status: routingResult.status,
        matchedRule: routingResult.matchedRule
      });

      // Create Audit Log via Repository
      await auditLogRepository.create({
        parcelId: parcel._id,
        action: routingResult.status,
        details: {
          message: routingResult.status === 'ROUTED' 
            ? `Parcel routed to ${routingResult.department}`
            : `Parcel flagged for Insurance Approval (Value: €${parcelData.value})`,
          ruleId: matchedRule ? matchedRule.id : 'fallback',
          weight: parcelData.weight,
          value: parcelData.value,
          destinationCountry: parcelData.destinationCountry
        }
      });

      // Log the decision structuredly
      logger.info(`Parcel routing decision: [${routingResult.status}] -> rule: "${routingResult.matchedRule}"`, {
        parcelId: parcel._id,
        weight: parcel.weight,
        value: parcel.value,
        destinationCountry: parcel.destinationCountry,
        status: parcel.status,
        department: parcel.department,
        matchedRule: parcel.matchedRule
      });

      return parcel;
    } catch (error) {
      // Write error to database audit logs via Repository
      try {
        await auditLogRepository.create({
          action: 'ERROR',
          details: {
            message: `Unexpected single routing error: ${error.message}`,
            input: parcelData
          }
        });
      } catch (logErr) {
        logger.error('Failed to save audit log for single route error', { logErr });
      }
      
      // Rethrow to let global error middleware handle and respond
      throw error;
    }
  }

  /**
   * Route a batch of parcels.
   * @param {Array<Object>} parcelsData 
   * @returns {Promise<Array>} List of routing execution results.
   */
  async routeBatch(parcelsData) {
    logger.info(`Starting batch routing for ${parcelsData.length} parcels.`);
    
    const results = [];
    for (const parcelData of parcelsData) {
      try {
        const parcel = await this.routeParcel(parcelData);
        results.push({
          success: true,
          parcel
        });
      } catch (error) {
        logger.error(`Error routing parcel in batch: ${error.message}`, {
          parcelData,
          error: error.stack
        });
        
        // Write error to database audit logs via Repository
        try {
          await auditLogRepository.create({
            action: 'ERROR',
            details: {
              message: `Batch routing failed item: ${error.message}`,
              input: parcelData
            }
          });
        } catch (logErr) {
          logger.error('Failed to save audit log for batch item error', { logErr });
        }

        results.push({
          success: false,
          error: error.message,
          input: parcelData
        });
      }
    }
    
    const succeeded = results.filter(r => r.success).length;
    logger.info(`Batch routing completed: ${succeeded}/${parcelsData.length} succeeded.`);
    return results;
  }

  /**
   * Get dashboard statistics from repository.
   * @returns {Promise<Object>} Object containing totals and metrics.
   */
  async getDashboardStats() {
    const [totalProcessed, insurancePending, heavyParcels, errorCount] = await Promise.all([
      parcelRepository.countAll(),
      parcelRepository.countByStatus('PENDING_INSURANCE_APPROVAL'),
      parcelRepository.countByDepartment('Heavy Department'),
      auditLogRepository.countByAction('ERROR')
    ]);

    return {
      totalParcelsProcessed: totalProcessed,
      insurancePending,
      heavyParcels,
      errorCount
    };
  }

  /**
   * Fetch all parcels matching a filter.
   * @param {Object} filter 
   * @returns {Promise<Array>}
   */
  async getParcels(filter = {}) {
    return await parcelRepository.findAll(filter);
  }

  /**
   * Fetch all system errors (audit logs with action: ERROR).
   * @returns {Promise<Array>}
   */
  async getErrors() {
    return await auditLogRepository.findAll({ action: 'ERROR' });
  }

  /**
   * Delete all parcels and audit logs to reset statistics.
   * @returns {Promise<void>}
   */
  async resetStats() {
    await Promise.all([
      parcelRepository.clearAll(),
      auditLogRepository.clearAll()
    ]);
  }
}

// Export a singleton instance of the routing service
module.exports = new RoutingService();
