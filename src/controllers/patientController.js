const { Patient, DentalRecord, Document, Appointment } = require('../models');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');

class PatientController {
  // Obtener todos los pacientes
  async getAllPatients(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;

      const whereClause = search ? {
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { dni: { [Op.iLike]: `%${search}%` } }
        ]
      } : {};

      const patients = await Patient.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, sortOrder]],
        include: [
          {
            model: DentalRecord,
            attributes: ['id', 'date', 'diagnosis'],
            limit: 1,
            order: [['date', 'DESC']]
          }
        ]
      });

      res.status(200).json({
        status: 'success',
        data: {
          patients: patients.rows,
          total: patients.count,
          totalPages: Math.ceil(patients.count / limit),
          currentPage: parseInt(page)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener un paciente específico
  async getPatient(req, res, next) {
    try {
      const patient = await Patient.findByPk(req.params.id, {
        include: [
          {
            model: DentalRecord,
            order: [['date', 'DESC']]
          },
          {
            model: Document,
            order: [['createdAt', 'DESC']]
          },
          {
            model: Appointment,
            include: ['dentist', 'treatment'],
            order: [['date', 'DESC']]
          }
        ]
      });

      if (!patient) {
        throw new AppError('Patient not found', 404);
      }

      res.status(200).json({
        status: 'success',
        data: patient
      });
    } catch (error) {
      next(error);
    }
  }

  // Crear nuevo paciente
  async createPatient(req, res, next) {
    try {
      const patientExists = await Patient.findOne({
        where: {
          [Op.or]: [
            { email: req.body.email },
            { dni: req.body.dni }
          ]
        }
      });

      if (patientExists) {
        throw new AppError('Patient already exists with this email or DNI', 400);
      }

      const patient = await Patient.create(req.body);

      res.status(201).json({
        status: 'success',
        data: patient
      });
    } catch (error) {
      next(error);
    }
  }

  // Actualizar paciente
  async updatePatient(req, res, next) {
    try {
      const patient = await Patient.findByPk(req.params.id);

      if (!patient) {
        throw new AppError('Patient not found', 404);
      }

      // Verificar email/dni duplicado si se está actualizando
      if (req.body.email || req.body.dni) {
        const patientExists = await Patient.findOne({
          where: {
            [Op.and]: [
              { id: { [Op.ne]: req.params.id } },
              {
                [Op.or]: [
                  { email: req.body.email || patient.email },
                  { dni: req.body.dni || patient.dni }
                ]
              }
            ]
          }
        });

        if (patientExists) {
          throw new AppError('Email or DNI already in use', 400);
        }
      }

      await patient.update(req.body);

      res.status(200).json({
        status: 'success',
        data: patient
      });
    } catch (error) {
      next(error);
    }
  }

  // Eliminar paciente
  async deletePatient(req, res, next) {
    try {
      const patient = await Patient.findByPk(req.params.id);

      if (!patient) {
        throw new AppError('Patient not found', 404);
      }

      // Verificar si tiene citas pendientes
      const pendingAppointments = await Appointment.findOne({
        where: {
          patientId: req.params.id,
          date: { [Op.gt]: new Date() },
          status: 'pending'
        }
      });

      if (pendingAppointments) {
        throw new AppError('Cannot delete patient with pending appointments', 400);
      }

      await patient.destroy();

      res.status(200).json({
        status: 'success',
        message: 'Patient deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener historial de citas
  async getPatientAppointments(req, res, next) {
    try {
      const appointments = await Appointment.findAll({
        where: { patientId: req.params.id },
        include: [
          {
            model: Treatment,
            attributes: ['name', 'cost']
          },
          {
            model: User,
            as: 'dentist',
            attributes: ['firstName', 'lastName']
          }
        ],
        order: [['date', 'DESC']]
      });

      res.status(200).json({
        status: 'success',
        data: appointments
      });
    } catch (error) {
      next(error);
    }
  }

  // Estadísticas del paciente
  async getPatientStats(req, res, next) {
    try {
      const stats = await Promise.all([
        // Total de citas
        Appointment.count({
          where: { patientId: req.params.id }
        }),
        // Total gastado
        Appointment.sum('Treatment.cost', {
          where: { 
            patientId: req.params.id,
            status: 'completed'
          },
          include: [{
            model: Treatment,
            attributes: []
          }]
        }),
        // Última visita
        Appointment.findOne({
          where: { 
            patientId: req.params.id,
            status: 'completed'
          },
          order: [['date', 'DESC']],
          attributes: ['date']
        })
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          totalAppointments: stats[0],
          totalSpent: stats[1] || 0,
          lastVisit: stats[2]?.date
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PatientController();