const Joi = require('joi');

const conditionSchema = Joi.object({
  field: Joi.string().valid('weight', 'value', 'destinationCountry').required(),
  operator: Joi.string().valid(
    'greater_than',
    'less_than_or_equal',
    'equal',
    'greater_than_or_equal',
    'less_than',
    'not_equal'
  ).required(),
  value: Joi.alternatives().try(Joi.number(), Joi.string()).required()
});

const actionSchema = Joi.object({
  department: Joi.string().optional(),
  status: Joi.string().valid('ROUTED', 'PENDING_INSURANCE_APPROVAL').required()
});

const ruleSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  conditions: Joi.array().items(conditionSchema).min(1).required(),
  action: actionSchema.required(),
  priority: Joi.number().integer().required()
});

const rulesConfigSchema = Joi.array().items(ruleSchema).min(1);

module.exports = {
  rulesConfigSchema,
  ruleSchema
};
