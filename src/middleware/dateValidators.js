const { query } = require('express-validator');
const moment = require('moment');

exports.validateDateRange = [
  query('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .custom((value) => {
      if (!moment(value, 'YYYY-MM-DD', true).isValid()) {
        throw new Error('Invalid start date format');
      }
      return true;
    }),

  query('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .custom((value) => {
      if (!moment(value, 'YYYY-MM-DD', true).isValid()) {
        throw new Error('Invalid end date format');
      }
      return true;
    })
    .custom((value, { req }) => {
      if (moment(value).isBefore(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
];