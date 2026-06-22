/**
 * Generic Express request body validation middleware using Joi.
 * @param {Object} schema - Joi validation schema 
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, allowUnknown: false });
  
  if (error) {
    const details = error.details.map(d => d.message).join(', ');
    const err = new Error(details);
    err.statusCode = 400;
    return next(err);
  }

  // Bind validated, sanitized parameters to request for down-funnel use
  req.validatedBody = value;
  next();
};

module.exports = validate;
