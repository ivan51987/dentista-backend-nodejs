const { body } = require('express-validator');

exports.validateTreatment = [
  body('name')
    .notEmpty()
    .withMessage('Treatment name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Treatment name must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  body('cost')
    .notEmpty()
    .withMessage('Cost is required')
    .isFloat({ min: 0 })
    .withMessage('Cost must be a positive number'),
  
  body('duration')
    .notEmpty()
    .withMessage('Duration is required')
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer'),
  
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['general', 'cosmetic', 'orthodontics', 'surgery', 'periodontics'])
    .withMessage('Invalid category'),
  
  body('requirements')
    .optional()
    .isArray()
    .withMessage('Requirements must be an array'),
  
  body('aftercare')
    .optional()
    .isArray()
    .withMessage('Aftercare must be an array')
];