const { DentalRecord, Patient, User, Treatment, Tooth } = require('../models');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');

class DentalRecordController {
  // Obtener historial dental de un paciente
  async getPatientDentalRecords(req, res, next) {
    try {
      const { patientId } = req.params;
      const { page = 1, limit = 10, startDate, endDate } = req.query;

      const offset = (page - 1) * limit;

      let whereClause = { patientId };

      if (startDate && endDate) {
        whereClause.date = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const records = await DentalRecord.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['date', 'DESC']],
        include: [
          {
            model: User,
            as: 'dentist',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: Treatment,
            attributes: ['id', 'name']
          },
          {
            model: Tooth,
            attributes: ['number', 'condition', 'treatment']
          }
        ]
      });

      // Obtener resumen del historial dental
      const summary = await this.getPatientDentalSummary(patientId);

      res.status(200).json({
        status: 'success',
        data: {
          records: records.rows,
          total: records.count,
          totalPages: Math.ceil(records.count / limit),
          currentPage: parseInt(page),
          summary
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Crear nuevo registro dental
  async createDentalRecord(req, res, next) {
    try {
      const {
        patientId,
        dentistId,
        treatmentId,
        diagnosis,
        procedures,
        observations,
        teeth
      } = req.body;

      // Verificar si el paciente existe
      const patient = await Patient.findByPk(patientId);
      if (!patient) {
        throw new AppError('Patient not found', 404);
      }

      // Crear el registro dental
      const dentalRecord = await DentalRecord.create({
        patientId,
        dentistId,
        treatmentId,
        date: new Date(),
        diagnosis,
        procedures,
        observations
      });

      // Si hay información de dientes, crear registros de dientes
      if (teeth && teeth.length > 0) {
        const teethRecords = teeth.map(tooth => ({
          ...tooth,
          dentalRecordId: dentalRecord.id
        }));

        await Tooth.bulkCreate(teethRecords);
      }

      // Cargar el registro completo con relaciones
      const completeRecord = await DentalRecord.findByPk(dentalRecord.id, {
        include: [
          {
            model: User,
            as: 'dentist',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: Treatment,
            attributes: ['id', 'name']
          },
          {
            model: Tooth,
            attributes: ['number', 'condition', 'treatment']
          }
        ]
      });

      res.status(201).json({
        status: 'success',
        data: completeRecord
      });
    } catch (error) {
      next(error);
    }
  }

  // Actualizar registro dental
  async updateDentalRecord(req, res, next) {
    try {
      const record = await DentalRecord.findByPk(req.params.id);

      if (!record) {
        throw new AppError('Dental record not found', 404);
      }

      // Verificar si el usuario tiene permiso para actualizar el registro
      if (req.user.role !== 'admin' && record.dentistId !== req.user.id) {
        throw new AppError('Not authorized to update this record', 403);
      }

      const {
        diagnosis,
        procedures,
        observations,
        teeth
      } = req.body;

      // Actualizar el registro principal
      await record.update({
        diagnosis,
        procedures,
        observations
      });

      // Actualizar información de dientes si se proporciona
      if (teeth && teeth.length > 0) {
        // Eliminar registros anteriores de dientes
        await Tooth.destroy({
          where: { dentalRecordId: record.id }
        });

        // Crear nuevos registros de dientes
        const teethRecords = teeth.map(tooth => ({
          ...tooth,
          dentalRecordId: record.id
        }));

        await Tooth.bulkCreate(teethRecords);
      }

      // Cargar el registro actualizado con todas las relaciones
      const updatedRecord = await DentalRecord.findByPk(record.id, {
        include: [
          {
            model: User,
            as: 'dentist',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: Treatment,
            attributes: ['id', 'name']
          },
          {
            model: Tooth,
            attributes: ['number', 'condition', 'treatment']
          }
        ]
      });

      res.status(200).json({
        status: 'success',
        data: updatedRecord
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener resumen del historial dental
  async getPatientDentalSummary(patientId) {
    try {
      const [
        totalRecords,
        lastVisit,
        commonTreatments,
        teethConditions
      ] = await Promise.all([
        // Total de registros
        DentalRecord.count({ where: { patientId } }),
        
        // Última visita
        DentalRecord.findOne({
          where: { patientId },
          order: [['date', 'DESC']],
          attributes: ['date']
        }),

        // Tratamientos más comunes
        DentalRecord.findAll({
          where: { patientId },
          include: [{
            model: Treatment,
            attributes: ['name']
          }],
          attributes: [
            'treatmentId',
            [sequelize.fn('COUNT', 'treatmentId'), 'count']
          ],
          group: ['treatmentId', 'Treatment.name'],
          order: [[sequelize.fn('COUNT', 'treatmentId'), 'DESC']],
          limit: 5
        }),

        // Estado general de los dientes
        Tooth.findAll({
          where: {
            dentalRecordId: {
              [Op.in]: sequelize.literal(
                `(SELECT id FROM dental_records WHERE "patientId" = '${patientId}')`
              )
            }
          },
          attributes: [
            'condition',
            [sequelize.fn('COUNT', 'condition'), 'count']
          ],
          group: ['condition']
        })
      ]);

      return {
        totalRecords,
        lastVisit: lastVisit?.date,
        commonTreatments: commonTreatments.map(t => ({
          treatment: t.Treatment.name,
          count: t.getDataValue('count')
        })),
        teethConditions: teethConditions.map(t => ({
          condition: t.condition,
          count: t.getDataValue('count')
        }))
      };
    } catch (error) {
      throw error;
    }
  }

  // Obtener registro dental específico
  async getDentalRecord(req, res, next) {
    try {
      const record = await DentalRecord.findByPk(req.params.id, {
        include: [
          {
            model: Patient,
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: User,
            as: 'dentist',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: Treatment,
            attributes: ['id', 'name']
          },
          {
            model: Tooth,
            attributes: ['number', 'condition', 'treatment']
          }
        ]
      });

      if (!record) {
        throw new AppError('Dental record not found', 404);
      }

      res.status(200).json({
        status: 'success',
        data: record
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DentalRecordController();