const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DentalRecord = sequelize.define('DentalRecord', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Patients',
      key: 'id'
    }
  },
  dentistId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  diagnosis: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  procedures: {
    type: DataTypes.ARRAY(DataTypes.STRING)
  },
  treatmentPlan: {
    type: DataTypes.TEXT
  },
  observations: {
    type: DataTypes.TEXT
  },
  odontogram: {
    type: DataTypes.JSONB
  },
  prescriptions: {
    type: DataTypes.JSONB
  },
  attachments: {
    type: DataTypes.ARRAY(DataTypes.STRING)
  },
  nextVisit: {
    type: DataTypes.DATE
  }
}, {
  timestamps: true
});

module.exports = DentalRecord;