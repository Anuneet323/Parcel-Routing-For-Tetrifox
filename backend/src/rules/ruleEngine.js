const logger = require('../config/logger');
const operators = require('./operators');

class RoutingRule {
  constructor(ruleConfig) {
    this.id = ruleConfig.id;
    this.name = ruleConfig.name;
    this.conditions = ruleConfig.conditions;
    this.action = ruleConfig.action;
    this.priority = ruleConfig.priority;
  }

  /**
   * Evaluate if a parcel matches this rule's conditions.
   * @param {Object} parcel - The parcel to evaluate (weight, value, destinationCountry)
   * @returns {boolean} True if all conditions are met, false otherwise.
   */
  evaluate(parcel) {
    for (const condition of this.conditions) {
      const { field, operator, value: targetValue } = condition;
      const parcelValue = parcel[field];

      if (parcelValue === undefined || parcelValue === null) {
        return false;
      }

      // Delegate evaluation directly to the extensible operators registry
      if (!operators.evaluate(operator, parcelValue, targetValue)) {
        return false;
      }
    }
    return true;
  }
}

class RuleRegistry {
  constructor() {
    this.rules = [];
  }

  /**
   * Load and register rules from a list of rule configurations.
   * @param {Array<Object>} rulesConfig 
   */
  loadRules(rulesConfig) {
    this.rules = rulesConfig
      .map(config => new RoutingRule(config))
      // Sort rules by priority descending (highest priority evaluated first)
      .sort((a, b) => b.priority - a.priority);
    
    logger.info(`Loaded and registered ${this.rules.length} routing rules successfully.`);
  }

  /**
   * Find the first rule that matches the parcel.
   * @param {Object} parcel 
   * @returns {RoutingRule|null} The matching rule or null if none match.
   */
  matchRule(parcel) {
    for (const rule of this.rules) {
      if (rule.evaluate(parcel)) {
        return rule;
      }
    }
    return null;
  }
}

module.exports = {
  RoutingRule,
  RuleRegistry
};
