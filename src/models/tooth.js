const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tooth = sequelize.define('Tooth', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  dentalRecordId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'DentalRecords',
      key: 'id'
    }
  },
  number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 32
    }
  },
  condition: {
    type: DataTypes.ENUM(
      'healthy',
      'decayed',
      'filled',
      'missing',
      'crown',
      'bridge',
      'implant'
    ),
    defaultValue: 'healthy'
  },
  surface: {
    type: DataTypes.ARRAY(DataTypes.STRING)
  },
  treatment: {
    type: DataTypes.STRING(500)
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true
});

module.exports = Tooth;