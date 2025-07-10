const { sendEmail } = require('./email');

exports.sendAppointmentNotification = async (appointment) => {
  // Email al paciente
  await sendEmail({
    email: appointment.patient.email,
    subject: 'Confirmación de cita dental',
    html: `
      <h1>Confirmación de cita</h1>
      <p>Tu cita ha sido programada para:</p>
      <p>Fecha: ${new Date(appointment.date).toLocaleDateString()}</p>
      <p>Hora: ${new Date(appointment.date).toLocaleTimeString()}</p>
      <p>Dentista: Dr. ${appointment.dentist.firstName} ${appointment.dentist.lastName}</p>
      <p>Tratamiento: ${appointment.treatment.name}</p>
    `
  });

  // Si tienes integración con SMS o WhatsApp, aquí irían esas notificaciones
};

exports.sendAppointmentReminder = async (appointment) => {
  await sendEmail({
    email: appointment.patient.email,
    subject: 'Recordatorio de cita dental',
    html: `
      <h1>Recordatorio de cita</h1>
      <p>Te recordamos que tienes una cita programada para mañana:</p>
      <p>Fecha: ${new Date(appointment.date).toLocaleDateString()}</p>
      <p>Hora: ${new Date(appointment.date).toLocaleTimeString()}</p>
      <p>Dentista: Dr. ${appointment.dentist.firstName} ${appointment.dentist.lastName}</p>
      <p>Tratamiento: ${appointment.treatment.name}</p>
    `
  });
};