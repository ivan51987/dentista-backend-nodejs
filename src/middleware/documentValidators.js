const { body } = require('express-validator');

exports.validateDocument = [
  body('patientId')
    .notEmpty()
    .withMessage('Patient ID is required')
    .isUUID()
    .withMessage('Invalid Patient ID format'),

  body('type')
    .notEmpty()
    .withMessage('Document type is required')
    .isIn(['xray', 'image', 'prescription', 'report', 'consent', 'other'])
    .withMessage('Invalid document type'),

  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
];