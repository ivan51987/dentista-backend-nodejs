const { Treatment, Appointment, Patient } = require('../models');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');

class TreatmentController {
  // Obtener todos los tratamientos
  async getAllTreatments(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        sortBy = 'name',
        sortOrder = 'ASC',
        category
      } = req.query;

      const offset = (page - 1) * limit;

      // Construir where clause
      let whereClause = {};
      
      if (search) {
        whereClause.name = { [Op.iLike]: `%${search}%` };
      }

      if (category) {
        whereClause.category = category;
      }

      const treatments = await Treatment.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, sortOrder]],
        attributes: {
          include: [
            // Incluir contador de citas para este tratamiento
            [
              sequelize.literal(`(
                SELECT COUNT(*)
                FROM appointments
                WHERE appointments."treatmentId" = "Treatment".id
              )`),
              'appointmentCount'
            ]
          ]
        }
      });

      res.status(200).json({
        status: 'success',
        data: {
          treatments: treatments.rows,
          total: treatments.count,
          totalPages: Math.ceil(treatments.count / limit),
          currentPage: parseInt(page)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener un tratamiento específico
  async getTreatment(req, res, next) {
    try {
      const treatment = await Treatment.findByPk(req.params.id, {
        include: [
          {
            model: Appointment,
            include: [
              {
                model: Patient,
                attributes: ['id', 'firstName', 'lastName']
              }
            ],
            limit: 5,
            order: [['date', 'DESC']]
          }
        ]
      });

      if (!treatment) {
        throw new AppError('Treatment not found', 404);
      }

      // Obtener estadísticas del tratamiento
      const stats = await this.getTreatmentStats(treatment.id);

      res.status(200).json({
        status: 'success',
        data: {
          ...treatment.toJSON(),
          stats
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Crear nuevo tratamiento
  async createTreatment(req, res, next) {
    try {
      const {
        name,
        description,
        cost,
        duration,
        category,
        requirements,
        aftercare
      } = req.body;

      // Verificar si ya existe un tratamiento con el mismo nombre
      const existingTreatment = await Treatment.findOne({
        where: { name: { [Op.iLike]: name } }
      });

      if (existingTreatment) {
        throw new AppError('Treatment with this name already exists', 400);
      }

      const treatment = await Treatment.create({
        name,
        description,
        cost,
        duration,
        category,
        requirements,
        aftercare,
        status: 'active'
      });

      res.status(201).json({
        status: 'success',
        data: treatment
      });
    } catch (error) {
      next(error);
    }
  }

  // Actualizar tratamiento
  async updateTreatment(req, res, next) {
    try {
      const treatment = await Treatment.findByPk(req.params.id);

      if (!treatment) {
        throw new AppError('Treatment not found', 404);
      }

      // Verificar nombre duplicado si se está actualizando
      if (req.body.name && req.body.name !== treatment.name) {
        const existingTreatment = await Treatment.findOne({
          where: {
            name: { [Op.iLike]: req.body.name },
            id: { [Op.ne]: req.params.id }
          }
        });

        if (existingTreatment) {
          throw new AppError('Treatment with this name already exists', 400);
        }
      }

      await treatment.update(req.body);

      res.status(200).json({
        status: 'success',
        data: treatment
      });
    } catch (error) {
      next(error);
    }
  }

  // Desactivar tratamiento
  async deactivateTreatment(req, res, next) {
    try {
      const treatment = await Treatment.findByPk(req.params.id);

      if (!treatment) {
        throw new AppError('Treatment not found', 404);
      }

      // Verificar si hay citas pendientes con este tratamiento
      const pendingAppointments = await Appointment.findOne({
        where: {
          treatmentId: req.params.id,
          status: 'pending',
          date: { [Op.gt]: new Date() }
        }
      });

      if (pendingAppointments) {
        throw new AppError('Cannot deactivate treatment with pending appointments', 400);
      }

      await treatment.update({ status: 'inactive' });

      res.status(200).json({
        status: 'success',
        message: 'Treatment deactivated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener estadísticas del tratamiento
  async getTreatmentStats(treatmentId) {
    const [totalAppointments, completedAppointments, totalRevenue, averageRating] = await Promise.all([
      // Total de citas
      Appointment.count({
        where: { treatmentId }
      }),
      // Citas completadas
      Appointment.count({
        where: { 
          treatmentId,
          status: 'completed'
        }
      }),
      // Ingresos totales
      Appointment.sum('Treatment.cost', {
        where: { 
          treatmentId,
          status: 'completed'
        },
        include: [{
          model: Treatment,
          attributes: []
        }]
      }),
      // Promedio de calificación (si tienes un sistema de calificación)
      Appointment.findOne({
        where: { treatmentId },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating']
        ]
      })
    ]);

    return {
      totalAppointments,
      completedAppointments,
      totalRevenue: totalRevenue || 0,
      averageRating: averageRating?.getDataValue('averageRating') || 0
    };
  }

  // Obtener tratamientos por categoría
  async getTreatmentsByCategory(req, res, next) {
    try {
      const treatments = await Treatment.findAll({
        where: {
          category: req.params.category,
          status: 'active'
        },
        order: [['name', 'ASC']]
      });

      res.status(200).json({
        status: 'success',
        data: treatments
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener categorías disponibles
  async getCategories(req, res, next) {
    try {
      const categories = await Treatment.findAll({
        attributes: [
          'category',
          [sequelize.fn('COUNT', sequelize.col('id')), 'treatmentCount']
        ],
        group: ['category'],
        where: { status: 'active' }
      });

      res.status(200).json({
        status: 'success',
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TreatmentController();