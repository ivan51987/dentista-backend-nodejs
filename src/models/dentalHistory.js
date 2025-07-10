const DentalHistory = sequelize.define('DentalHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  patientId: {
    type: DataTypes.UUID,
    references: {
      model: 'Patients',
      key: 'id'
    }
  },
  treatment: DataTypes.STRING,
  diagnosis: DataTypes.TEXT,
  date: DataTypes.DATE,
  notes: DataTypes.TEXT
});