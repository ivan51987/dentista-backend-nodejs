const { User, Appointment, Treatment } = require('../models');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sendWelcomeEmail } = require('../utils/email');

class UserController {
  // Obtener todos los usuarios
  async getAllUsers(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        role,
        status = 'active'
      } = req.query;

      const offset = (page - 1) * limit;

      let whereClause = { status };
      
      if (search) {
        whereClause = {
          ...whereClause,
          [Op.or]: [
            { firstName: { [Op.iLike]: `%${search}%` } },
            { lastName: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } }
          ]
        };
      }

      if (role) {
        whereClause.role = role;
      }

      const users = await User.findAndCountAll({
        where: whereClause,
        attributes: { exclude: ['password'] },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      res.status(200).json({
        status: 'success',
        data: {
          users: users.rows,
          total: users.count,
          totalPages: Math.ceil(users.count / limit),
          currentPage: parseInt(page)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener usuario específico
  async getUser(req, res, next) {
    try {
      const user = await User.findByPk(req.params.id, {
        attributes: { exclude: ['password'] },
        include: [
          {
            model: Appointment,
            as: 'appointments',
            include: [
              {
                model: Treatment,
                attributes: ['name', 'duration']
              }
            ],
            limit: 5,
            order: [['date', 'DESC']]
          }
        ]
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.status(200).json({
        status: 'success',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  // Crear nuevo usuario
  async createUser(req, res, next) {
    try {
      const {
        firstName,
        lastName,
        email,
        password,
        role,
        specialization,
        workingHours
      } = req.body;

      // Verificar si el email ya existe
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        throw new AppError('Email already in use', 400);
      }

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(password, 12);

      // Crear usuario
      const user = await User.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role,
        specialization,
        workingHours,
        status: 'active'
      });

      // Enviar email de bienvenida
      await sendWelcomeEmail(user);

      // Excluir password de la respuesta
      const userWithoutPassword = user.toJSON();
      delete userWithoutPassword.password;

      res.status(201).json({
        status: 'success',
        data: userWithoutPassword
      });
    } catch (error) {
      next(error);
    }
  }

  // Actualizar usuario
  async updateUser(req, res, next) {
    try {
      const user = await User.findByPk(req.params.id);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const {
        firstName,
        lastName,
        email,
        role,
        specialization,
        workingHours
      } = req.body;

      // Verificar email duplicado
      if (email && email !== user.email) {
        const existingUser = await User.findOne({
          where: {
            email,
            id: { [Op.ne]: req.params.id }
          }
        });

        if (existingUser) {
          throw new AppError('Email already in use', 400);
        }
      }

      await user.update({
        firstName,
        lastName,
        email,
        role,
        specialization,
        workingHours
      });

      // Excluir password de la respuesta
      const userWithoutPassword = user.toJSON();
      delete userWithoutPassword.password;

      res.status(200).json({
        status: 'success',
        data: userWithoutPassword
      });
    } catch (error) {
      next(error);
    }
  }

  // Cambiar contraseña
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findByPk(req.params.id);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Verificar contraseña actual
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new AppError('Current password is incorrect', 401);
      }

      // Encriptar nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await user.update({ password: hashedPassword });

      res.status(200).json({
        status: 'success',
        message: 'Password updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Desactivar usuario
  async deactivateUser(req, res, next) {
    try {
      const user = await User.findByPk(req.params.id);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Verificar si tiene citas pendientes
      const pendingAppointments = await Appointment.findOne({
        where: {
          dentistId: req.params.id,
          date: { [Op.gt]: new Date() },
          status: 'pending'
        }
      });

      if (pendingAppointments) {
        throw new AppError('Cannot deactivate user with pending appointments', 400);
      }

      await user.update({ status: 'inactive' });

      res.status(200).json({
        status: 'success',
        message: 'User deactivated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener horario de trabajo
  async getWorkingHours(req, res, next) {
    try {
      const user = await User.findByPk(req.params.id);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.status(200).json({
        status: 'success',
        data: user.workingHours
      });
    } catch (error) {
      next(error);
    }
  }

  // Actualizar horario de trabajo
  async updateWorkingHours(req, res, next) {
    try {
      const user = await User.findByPk(req.params.id);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      await user.update({ workingHours: req.body });

      res.status(200).json({
        status: 'success',
        data: user.workingHours
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener estadísticas del usuario
  async getUserStats(req, res, next) {
    try {
      const userId = req.params.id;
      const startDate = moment().startOf('month');
      const endDate = moment().endOf('month');

      const [
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        revenue
      ] = await Promise.all([
        Appointment.count({
          where: {
            dentistId: userId,
            date: { [Op.between]: [startDate, endDate] }
          }
        }),
        Appointment.count({
          where: {
            dentistId: userId,
            status: 'completed',
            date: { [Op.between]: [startDate, endDate] }
          }
        }),
        Appointment.count({
          where: {
            dentistId: userId,
            status: 'cancelled',
            date: { [Op.between]: [startDate, endDate] }
          }
        }),
        Appointment.sum('Treatment.cost', {
          where: {
            dentistId: userId,
            status: 'completed',
            date: { [Op.between]: [startDate, endDate] }
          },
          include: [{
            model: Treatment,
            attributes: []
          }]
        })
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          totalAppointments,
          completedAppointments,
          cancelledAppointments,
          revenue: revenue || 0,
          period: {
            start: startDate,
            end: endDate
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();