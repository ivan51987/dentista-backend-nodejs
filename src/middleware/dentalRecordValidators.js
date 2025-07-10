const { body } = require('express-validator');

exports.validateDentalRecord = [
  body('patientId')
    .notEmpty()
    .withMessage('Patient ID is required')
    .isUUID()
    .withMessage('Invalid Patient ID format'),

  body('dentistId')
    .notEmpty()
    .withMessage('Dentist ID is required')
    .isUUID()
    .withMessage('Invalid Dentist ID format'),

  body('treatmentId')
    .optional()
    .isUUID()
    .withMessage('Invalid Treatment ID format'),

  body('diagnosis')
    .notEmpty()
    .withMessage('Diagnosis is required')
    .isLength({ max: 1000 })
    .withMessage('Diagnosis cannot exceed 1000 characters'),

  body('procedures')
    .optional()
    .isArray()
    .withMessage('Procedures must be an array'),

  body('observations')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Observations cannot exceed 1000 characters'),

  body('teeth')
    .optional()
    .isArray()
    .withMessage('Teeth must be an array'),

  body('teeth.*.number')
    .optional()
    .isInt({ min: 1, max: 32 })
    .withMessage('Invalid tooth number'),

  body('teeth.*.condition')
    .optional()
    .isIn(['healthy', 'decayed', 'filled', 'missing', 'crown', 'bridge', 'implant'])
    .withMessage('Invalid tooth condition'),

  body('teeth.*.treatment')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Treatment description cannot exceed 500 characters')
];