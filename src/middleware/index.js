const userValidators = require('./userValidators');
const treatmentValidators = require('./treatmentValidators');
const dentalRecordValidators = require('./dentalRecordValidators');
const documentValidators = require('./documentValidators');
const dateValidators = require('./dateValidators');
const authValidators = require('./authValidators');

module.exports = {
  ...userValidators,
  ...treatmentValidators,
  ...dentalRecordValidators,
  ...documentValidators,
  ...dateValidators,
  ...authValidators
};