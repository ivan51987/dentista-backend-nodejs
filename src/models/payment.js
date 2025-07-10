const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  appointmentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Appointments',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  method: {
    type: DataTypes.ENUM('cash', 'card', 'transfer', 'other'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'refunded'),
    defaultValue: 'pending'
  },
  transactionId: {
    type: DataTypes.STRING
  },
  notes: {
    type: DataTypes.TEXT
  },
  receiptNumber: {
    type: DataTypes.STRING
  }
}, {
  timestamps: true
});

module.exports = Payment;