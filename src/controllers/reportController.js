const { 
  Appointment, 
  Treatment, 
  Patient, 
  User, 
  DentalRecord,
  Document 
} = require('../models');
const { Op } = require('sequelize');
const AppError = require('../utils/appError');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const moment = require('moment');

class ReportController {
  // Reporte de Ingresos
  async getRevenueReport(req, res, next) {
    try {
      const { startDate, endDate, groupBy = 'day' } = req.query;

      let groupFormat;
      let dateGrouping;

      switch (groupBy) {
        case 'day':
          groupFormat = 'YYYY-MM-DD';
          dateGrouping = sequelize.fn('DATE', sequelize.col('date'));
          break;
        case 'week':
          groupFormat = 'YYYY-[W]WW';
          dateGrouping = sequelize.fn('date_trunc', 'week', sequelize.col('date'));
          break;
        case 'month':
          groupFormat = 'YYYY-MM';
          dateGrouping = sequelize.fn('date_trunc', 'month', sequelize.col('date'));
          break;
        default:
          throw new AppError('Invalid groupBy parameter', 400);
      }

      const revenue = await Appointment.findAll({
        where: {
          date: {
            [Op.between]: [startDate, endDate]
          },
          status: 'completed'
        },
        attributes: [
          [dateGrouping, 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'appointmentCount'],
          [sequelize.fn('SUM', sequelize.col('Treatment.cost')), 'totalRevenue']
        ],
        include: [{
          model: Treatment,
          attributes: []
        }],
        group: [dateGrouping],
        order: [['date', 'ASC']]
      });

      // Calcular estadísticas
      const totalRevenue = revenue.reduce((sum, r) => sum + parseFloat(r.totalRevenue), 0);
      const totalAppointments = revenue.reduce((sum, r) => sum + parseInt(r.appointmentCount), 0);
      const averageRevenuePerDay = totalRevenue / revenue.length;

      res.status(200).json({
        status: 'success',
        data: {
          revenue,
          summary: {
            totalRevenue,
            totalAppointments,
            averageRevenuePerDay,
            period: {
              start: startDate,
              end: endDate
            }
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Reporte de Rendimiento de Dentistas
  async getDentistPerformanceReport(req, res, next) {
    try {
      const { startDate, endDate, dentistId } = req.query;

      let whereClause = {
        date: {
          [Op.between]: [startDate, endDate]
        }
      };

      if (dentistId) {
        whereClause.dentistId = dentistId;
      }

      const performance = await Appointment.findAll({
        where: whereClause,
        attributes: [
          'dentistId',
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalAppointments'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'completed' THEN 1 ELSE 0 END")), 'completedAppointments'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END")), 'cancelledAppointments'],
          [sequelize.fn('AVG', sequelize.col('Treatment.duration')), 'averageDuration'],
          [sequelize.fn('SUM', sequelize.col('Treatment.cost')), 'totalRevenue']
        ],
        include: [
          {
            model: User,
            as: 'dentist',
            attributes: ['firstName', 'lastName']
          },
          {
            model: Treatment,
            attributes: []
          }
        ],
        group: ['dentistId', 'dentist.id', 'dentist.firstName', 'dentist.lastName']
      });

      res.status(200).json({
        status: 'success',
        data: performance
      });
    } catch (error) {
      next(error);
    }
  }

  // Reporte de Tratamientos Populares
  async getPopularTreatmentsReport(req, res, next) {
    try {
      const { startDate, endDate } = req.query;

      const treatments = await Appointment.findAll({
        where: {
          date: {
            [Op.between]: [startDate, endDate]
          },
          status: 'completed'
        },
        attributes: [
          'treatmentId',
          [sequelize.fn('COUNT', sequelize.col('id')), 'appointmentCount'],
          [sequelize.fn('SUM', sequelize.col('Treatment.cost')), 'totalRevenue']
        ],
        include: [{
          model: Treatment,
          attributes: ['name', 'cost']
        }],
        group: ['treatmentId', 'Treatment.id', 'Treatment.name', 'Treatment.cost'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
      });

      res.status(200).json({
        status: 'success',
        data: treatments
      });
    } catch (error) {
      next(error);
    }
  }

  // Reporte de Pacientes Nuevos
  async getNewPatientsReport(req, res, next) {
    try {
      const { startDate, endDate } = req.query;

      const newPatients = await Patient.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        },
        attributes: [
          [sequelize.fn('date_trunc', 'day', sequelize.col('createdAt')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'newPatients']
        ],
        group: [sequelize.fn('date_trunc', 'day', sequelize.col('createdAt'))],
        order: [[sequelize.fn('date_trunc', 'day', sequelize.col('createdAt')), 'ASC']]
      });

      // Estadísticas adicionales
      const totalNewPatients = newPatients.reduce((sum, day) => sum + parseInt(day.newPatients), 0);
      const averageNewPatientsPerDay = totalNewPatients / newPatients.length;

      res.status(200).json({
        status: 'success',
        data: {
          daily: newPatients,
          summary: {
            totalNewPatients,
            averageNewPatientsPerDay,
            period: {
              start: startDate,
              end: endDate
            }
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Exportar reportes a PDF
  async exportReportToPDF(req, res, next) {
    try {
      const { reportType, startDate, endDate } = req.query;
      
      // Obtener datos del reporte
      let reportData;
      switch (reportType) {
        case 'revenue':
          reportData = await this.getRevenueReportData(startDate, endDate);
          break;
        case 'dentists':
          reportData = await this.getDentistPerformanceData(startDate, endDate);
          break;
        case 'treatments':
          reportData = await this.getPopularTreatmentsData(startDate, endDate);
          break;
        default:
          throw new AppError('Invalid report type', 400);
      }

      // Crear PDF
      const doc = new PDFDocument();
      
      // Configurar respuesta
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${reportType}-report.pdf`);
      
      doc.pipe(res);

      // Generar PDF según el tipo de reporte
      this.generatePDFReport(doc, reportType, reportData);

      doc.end();
    } catch (error) {
      next(error);
    }
  }

  // Exportar reportes a Excel
  async exportReportToExcel(req, res, next) {
    try {
      const { reportType, startDate, endDate } = req.query;

      // Obtener datos del reporte
      let reportData;
      switch (reportType) {
        case 'revenue':
          reportData = await this.getRevenueReportData(startDate, endDate);
          break;
        case 'dentists':
          reportData = await this.getDentistPerformanceData(startDate, endDate);
          break;
        case 'treatments':
          reportData = await this.getPopularTreatmentsData(startDate, endDate);
          break;
        default:
          throw new AppError('Invalid report type', 400);
      }

      // Crear workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Report');

      // Generar Excel según el tipo de reporte
      this.generateExcelReport(worksheet, reportType, reportData);

      // Configurar respuesta
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${reportType}-report.xlsx`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      next(error);
    }
  }

  // Dashboard general
  async getDashboardStats(req, res, next) {
    try {
      const today = moment().startOf('day');
      const thisMonth = moment().startOf('month');

      const [
        todayAppointments,
        monthlyRevenue,
        activePatients,
        pendingAppointments
      ] = await Promise.all([
        // Citas de hoy
        Appointment.count({
          where: {
            date: {
              [Op.between]: [today.toDate(), moment().endOf('day').toDate()]
            }
          }
        }),
        // Ingresos del mes
        Appointment.sum('Treatment.cost', {
          where: {
            date: {
              [Op.between]: [thisMonth.toDate(), moment().endOf('month').toDate()]
            },
            status: 'completed'
          },
          include: [{
            model: Treatment,
            attributes: []
          }]
        }),
        // Pacientes activos (con cita en los últimos 6 meses)
        Patient.count({
          include: [{
            model: Appointment,
            where: {
              date: {
                [Op.gte]: moment().subtract(6, 'months').toDate()
              }
            }
          }]
        }),
        // Citas pendientes
        Appointment.count({
          where: {
            status: 'pending',
            date: {
              [Op.gt]: new Date()
            }
          }
        })
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          todayAppointments,
          monthlyRevenue: monthlyRevenue || 0,
          activePatients,
          pendingAppointments
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportController();