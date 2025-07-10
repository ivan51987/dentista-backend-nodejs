const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Appointment = sequelize.define('Appointment', {
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
  treatmentId: {
    type: DataTypes.UUID,
    references: {
      model: 'Treatments',
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'cancelled', 'no-show'),
    defaultValue: 'pending'
  },
  duration: {
    type: DataTypes.INTEGER, // en minutos
    defaultValue: 30
  },
  notes: {
    type: DataTypes.TEXT
  },
  cancellationReason: {
    type: DataTypes.STRING
  },
  reminderSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  confirmationStatus: {
    type: DataTypes.ENUM('pending', 'confirmed', 'rejected'),
    defaultValue: 'pending'
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'partial', 'completed'),
    defaultValue: 'pending'
  }
}, {
  timestamps: true
});

module.exports = Appointment;