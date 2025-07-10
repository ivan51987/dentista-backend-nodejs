const { Appointment, Patient, User, Treatment } = require('../models');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');
const { sendAppointmentEmail, sendAppointmentSMS } = require('../utils/notifications');

class AppointmentController {
  // Obtener todas las citas
  async getAllAppointments(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        startDate,
        endDate,
        dentistId,
        status,
        search
      } = req.query;

      const offset = (page - 1) * limit;

      let whereClause = {};
      
      if (startDate && endDate) {
        whereClause.date = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      if (dentistId) {
        whereClause.dentistId = dentistId;
      }

      if (status) {
        whereClause.status = status;
      }

      if (search) {
        whereClause = {
          ...whereClause,
          [Op.or]: [
            { '$patient.firstName$': { [Op.iLike]: `%${search}%` } },
            { '$patient.lastName$': { [Op.iLike]: `%${search}%` } }
          ]
        };
      }

      const appointments = await Appointment.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['date', 'ASC']],
        include: [
          {
            model: Patient,
            attributes: ['id', 'firstName', 'lastName', 'phone', 'email']
          },
          {
            model: User,
            as: 'dentist',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: Treatment,
            attributes: ['id', 'name', 'duration', 'cost']
          }
        ]
      });

      res.status(200).json({
        status: 'success',
        data: {
          appointments: appointments.rows,
          total: appointments.count,
          totalPages: Math.ceil(appointments.count / limit),
          currentPage: parseInt(page)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getAppointment(req, res, next) {
    try {
      const appointment = await Appointment.findByPk(req.params.id, {
        include: [
          {
            model: Patient,
            attributes: ['id', 'firstName', 'lastName', 'phone', 'email']
          },
          {
            model: User,
            as: 'dentist',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: Treatment,
            attributes: ['id', 'name', 'duration', 'cost']
          }
        ]
      });

      if (!appointment) {
        throw new AppError('Appointment not found', 404);
      }

      res.status(200).json({
        status: 'success',
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  }

  // Crear nueva cita
  async createAppointment(req, res, next) {
    try {
      const { patientId, dentistId, treatmentId, date, notes } = req.body;

      const isAvailable = await this.checkDentistAvailability(
        dentistId,
        date,
        treatmentId
      );

      if (!isAvailable) {
        throw new AppError('Dentist is not available at this time', 400);
      }

      const appointment = await Appointment.create({
        patientId,
        dentistId,
        treatmentId,
        date,
        notes,
        status: 'pending'
      });

      // Cargar los datos relacionados
      const fullAppointment = await Appointment.findByPk(appointment.id, {
        include: [
          {
            model: Patient,
            attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
          },
          {
            model: User,
            as: 'dentist',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: Treatment,
            attributes: ['id', 'name', 'duration', 'cost']
          }
        ]
      });

      // Enviar notificaciones
      await Promise.all([
        sendAppointmentEmail(fullAppointment),
        sendAppointmentSMS(fullAppointment)
      ]);

      res.status(201).json({
        status: 'success',
        data: fullAppointment
      });
    } catch (error) {
      next(error);
    }
  }

  // Actualizar cita
  async updateAppointment(req, res, next) {
    try {
      const appointment = await Appointment.findByPk(req.params.id);

      if (!appointment) {
        throw new AppError('Appointment not found', 404);
      }

      // Si se está actualizando la fecha o el dentista, verificar disponibilidad
      if (req.body.date || req.body.dentistId) {
        const isAvailable = await this.checkDentistAvailability(
          req.body.dentistId || appointment.dentistId,
          req.body.date || appointment.date,
          appointment.treatmentId,
          appointment.id
        );

        if (!isAvailable) {
          throw new AppError('Dentist is not available at this time', 400);
        }
      }

      await appointment.update(req.body);

      // Si se cambió la fecha, enviar notificaciones
      if (req.body.date) {
        await Promise.all([
          sendAppointmentEmail(appointment, 'update'),
          sendAppointmentSMS(appointment, 'update')
        ]);
      }

      const updatedAppointment = await Appointment.findByPk(appointment.id, {
        include: [
          {
            model: Patient,
            attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
          },
          {
            model: User,
            as: 'dentist',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: Treatment,
            attributes: ['id', 'name', 'duration', 'cost']
          }
        ]
      });

      res.status(200).json({
        status: 'success',
        data: updatedAppointment
      });
    } catch (error) {
      next(error);
    }
  }

  // Cancelar cita
  async cancelAppointment(req, res, next) {
    try {
      const appointment = await Appointment.findByPk(req.params.id, {
        include: [
          {
            model: Patient,
            attributes: ['email', 'phone']
          }
        ]
      });

      if (!appointment) {
        throw new AppError('Appointment not found', 404);
      }

      if (appointment.status === 'cancelled') {
        throw new AppError('Appointment is already cancelled', 400);
      }

      await appointment.update({
        status: 'cancelled',
        cancellationReason: req.body.reason || 'No reason provided'
      });

      // Notificar al paciente
      await Promise.all([
        sendAppointmentEmail(appointment, 'cancellation'),
        sendAppointmentSMS(appointment, 'cancellation')
      ]);

      res.status(200).json({
        status: 'success',
        message: 'Appointment cancelled successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Marcar cita como completada
  async completeAppointment(req, res, next) {
    try {
      const appointment = await Appointment.findByPk(req.params.id);

      if (!appointment) {
        throw new AppError('Appointment not found', 404);
      }

      if (appointment.status !== 'pending') {
        throw new AppError(`Cannot complete appointment with status: ${appointment.status}`, 400);
      }

      await appointment.update({
        status: 'completed',
        notes: req.body.notes || appointment.notes
      });

      res.status(200).json({
        status: 'success',
        message: 'Appointment marked as completed'
      });
    } catch (error) {
      next(error);
    }
  }

  // Verificar disponibilidad del dentista
  async checkDentistAvailability(dentistId, date, treatmentId, excludeAppointmentId = null) {
    const treatment = await Treatment.findByPk(treatmentId);
    if (!treatment) {
      throw new AppError('Treatment not found', 404);
    }

    const appointmentDate = new Date(date);
    const endTime = new Date(appointmentDate.getTime() + treatment.duration * 60000);

    const overlappingAppointment = await Appointment.findOne({
      where: {
        id: { [Op.ne]: excludeAppointmentId },
        dentistId,
        status: 'pending',
        [Op.or]: [
          {
            date: {
              [Op.between]: [appointmentDate, endTime]
            }
          },
          {
            '$treatment.endTime$': {
              [Op.between]: [appointmentDate, endTime]
            }
          }
        ]
      },
      include: [{
        model: Treatment,
        attributes: ['duration']
      }]
    });

    return !overlappingAppointment;
  }

  // Obtener disponibilidad del dentista por fecha
  async getDentistAvailability(req, res, next) {
    try {
      const { dentistId, date } = req.query;

      const appointments = await Appointment.findAll({
        where: {
          dentistId,
          date: {
            [Op.between]: [
              new Date(date).setHours(0, 0, 0),
              new Date(date).setHours(23, 59, 59)
            ]
          },
          status: 'pending'
        },
        include: [{
          model: Treatment,
          attributes: ['duration']
        }],
        order: [['date', 'ASC']]
      });

      // Obtener horario del dentista
      const dentist = await User.findByPk(dentistId);
      const workingHours = dentist.workingHours || {
        start: '09:00',
        end: '18:00',
        breakStart: '13:00',
        breakEnd: '14:00'
      };
      // Calcular slots disponibles
      const availableSlots = this.calculateAvailableSlots(
        appointments,
        workingHours,
        date
      );

      res.status(200).json({
        status: 'success',
        data: availableSlots
      });
    } catch (error) {
      next(error);
    }
  }

  
  calculateAvailableSlots(appointments, workingHours, date) {
    
    
  }
}

module.exports = new AppointmentController();