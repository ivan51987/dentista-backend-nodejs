const User = require('./user');
const Patient = require('./patient');
const Appointment = require('./appointment');
const Treatment = require('./treatment');
const DentalRecord = require('./dentalRecord');
const Document = require('./document');
const Tooth = require('./tooth');
const Payment = require('./payment');

// Paciente - Citas
Patient.hasMany(Appointment, {
  foreignKey: 'patientId',
  as: 'appointments'
});
Appointment.belongsTo(Patient, {
  foreignKey: 'patientId',
  as: 'patient'
});

// Usuario (Dentista) - Citas
User.hasMany(Appointment, {
  foreignKey: 'dentistId',
  as: 'appointmentsAsDentist'
});
Appointment.belongsTo(User, {
  foreignKey: 'dentistId',
  as: 'dentist'
});

// Tratamiento - Citas
Treatment.hasMany(Appointment, {
  foreignKey: 'treatmentId',
  as: 'appointments'
});
Appointment.belongsTo(Treatment, {
  foreignKey: 'treatmentId',
  as: 'treatment'
});

// Paciente - Historial Dental
Patient.hasMany(DentalRecord, {
  foreignKey: 'patientId',
  as: 'dentalRecords'
});
DentalRecord.belongsTo(Patient, {
  foreignKey: 'patientId',
  as: 'patient'
});

// Usuario (Dentista) - Historial Dental
User.hasMany(DentalRecord, {
  foreignKey: 'dentistId',
  as: 'dentalRecordsCreated'
});
DentalRecord.belongsTo(User, {
  foreignKey: 'dentistId',
  as: 'dentalRecordDentist'
});

// Historial Dental - Dientes
DentalRecord.hasMany(Tooth, {
  foreignKey: 'dentalRecordId',
  as: 'teeth'
});
Tooth.belongsTo(DentalRecord, {
  foreignKey: 'dentalRecordId',
  as: 'dentalRecord'
});

// Paciente - Documentos
Patient.hasMany(Document, {
  foreignKey: 'patientId',
  as: 'documents'
});
Document.belongsTo(Patient, {
  foreignKey: 'patientId',
  as: 'patient'
});

// Usuario - Documentos (subidos por)
User.hasMany(Document, {
  foreignKey: 'uploadedById',
  as: 'uploadedDocuments'
});
Document.belongsTo(User, {
  foreignKey: 'uploadedById',
  as: 'uploadedBy'
});

// Cita - Pagos
Appointment.hasMany(Payment, {
  foreignKey: 'appointmentId',
  as: 'payments'
});
Payment.belongsTo(Appointment, {
  foreignKey: 'appointmentId',
  as: 'appointment'
});

module.exports = {
  User,
  Patient,
  Appointment,
  Treatment,
  DentalRecord,
  Document,
  Tooth,
  Payment
};