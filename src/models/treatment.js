const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Treatment = sequelize.define('Treatment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER, // en minutos
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM(
      'general',
      'cosmetic',
      'orthodontics',
      'surgery',
      'periodontics',
      'endodontics',
      'pediatric'
    )
  },
  requirements: {
    type: DataTypes.ARRAY(DataTypes.STRING)
  },
  aftercare: {
    type: DataTypes.ARRAY(DataTypes.STRING)
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  },
  materialNeeded: {
    type: DataTypes.JSONB
  }
}, {
  timestamps: true
});

module.exports = Treatment;