const { body } = require('express-validator');

exports.validateUser = [
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),

  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),

  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),

  body('password')
    .if(body('password').exists())
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
    .withMessage('Password must contain at least one number, one uppercase letter, one lowercase letter, and one special character'),

  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['admin', 'dentist', 'assistant', 'receptionist'])
    .withMessage('Invalid role'),

  body('specialization')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Specialization cannot exceed 100 characters'),

  body('workingHours')
    .optional()
    .isObject()
    .withMessage('Working hours must be an object')
];

exports.validateWorkingHours = [
  body()
    .isObject()
    .withMessage('Working hours must be an object')
    .custom((value) => {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

      for (const day of Object.keys(value)) {
        if (!days.includes(day.toLowerCase())) {
          throw new Error(`Invalid day: ${day}`);
        }

        if (!value[day].start || !value[day].end) {
          throw new Error(`Missing start or end time for ${day}`);
        }

        if (!timeRegex.test(value[day].start) || !timeRegex.test(value[day].end)) {
          throw new Error(`Invalid time format for ${day}`);
        }

        if (value[day].start >= value[day].end) {
          throw new Error(`End time must be after start time for ${day}`);
        }
      }

      return true;
    })
];

exports.validatePatient = [
  body('firstName')
    .notEmpty().withMessage('First name is required')
    .isLength({ max: 50 }).withMessage('First name must be at most 50 characters'),
  
  body('lastName')
    .notEmpty().withMessage('Last name is required')
    .isLength({ max: 50 }).withMessage('Last name must be at most 50 characters'),

  body('email')
    .optional() 
    .isEmail().withMessage('Email must be valid'),

  body('phone')
    .optional()
    .isMobilePhone().withMessage('Phone must be a valid mobile number'),

  body('birthDate')
    .optional()
    .isISO8601().withMessage('Birth date must be a valid date'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    next();
  }
];
