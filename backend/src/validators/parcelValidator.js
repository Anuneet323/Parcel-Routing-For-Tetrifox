const Joi = require('joi');

const parcelInputSchema = Joi.object({
  weight: Joi.number().greater(0).required().messages({
    'number.base': 'Weight must be a number',
    'number.greater': 'Weight must be greater than 0 kg',
    'any.required': 'Weight is required'
  }),
  value: Joi.number().min(0).required().messages({
    'number.base': 'Value must be a number',
    'number.min': 'Value cannot be negative',
    'any.required': 'Value is required'
  }),
  destinationCountry: Joi.string().trim().min(2).required().messages({
    'string.base': 'Destination country must be text',
    'string.empty': 'Destination country cannot be empty',
    'string.min': 'Destination country must be at least 2 characters',
    'any.required': 'Destination country is required'
  })
});

const batchParcelInputSchema = Joi.array().items(parcelInputSchema).min(1).required().messages({
  'array.base': 'Batch request must be a JSON array',
  'array.min': 'Batch request must contain at least 1 parcel',
  'any.required': 'Batch payload is required'
});

module.exports = {
  parcelInputSchema,
  batchParcelInputSchema
};
