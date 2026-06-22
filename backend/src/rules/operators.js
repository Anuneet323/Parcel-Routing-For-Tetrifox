const logger = require('../config/logger');

class OperatorRegistry {
  constructor() {
    this.operators = new Map();
    this._registerDefaults();
  }

  /**
   * Register a custom operator function.
   * @param {string} name - Operator name (e.g. 'matches_regex')
   * @param {function} fn - Predicate function (actualValue, targetValue) => boolean
   */
  register(name, fn) {
    if (this.operators.has(name)) {
      logger.warn(`Overwriting registered operator: ${name}`);
    }
    this.operators.set(name, fn);
  }

  /**
   * Evaluate a condition comparison.
   * @param {string} operatorName 
   * @param {any} actual 
   * @param {any} target 
   * @returns {boolean}
   */
  evaluate(operatorName, actual, target) {
    const fn = this.operators.get(operatorName);
    if (!fn) {
      logger.error(`Operator evaluation requested for unknown operator: ${operatorName}`);
      return false;
    }
    try {
      return fn(actual, target);
    } catch (err) {
      logger.error(`Error executing operator '${operatorName}': ${err.message}`);
      return false;
    }
  }

  _registerDefaults() {
    // Numeric comparisons
    this.register('greater_than', (actual, target) => Number(actual) > Number(target));
    this.register('less_than_or_equal', (actual, target) => Number(actual) <= Number(target));
    this.register('greater_than_or_equal', (actual, target) => Number(actual) >= Number(target));
    this.register('less_than', (actual, target) => Number(actual) < Number(target));
    
    // Case-insensitive string comparisons helper
    const stringCompare = (a, b, cmp) => {
      const isStringCompare = typeof a === 'string' && typeof b === 'string';
      const normA = isStringCompare ? a.trim().toLowerCase() : a;
      const normB = isStringCompare ? b.trim().toLowerCase() : b;
      return cmp(normA, normB);
    };

    this.register('equal', (actual, target) => stringCompare(actual, target, (x, y) => x === y));
    this.register('not_equal', (actual, target) => stringCompare(actual, target, (x, y) => x !== y));
  }
}

// Export singleton registry instance
module.exports = new OperatorRegistry();
