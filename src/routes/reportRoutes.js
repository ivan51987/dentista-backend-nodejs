const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { validateDateRange, checkRole } = require('../middleware/index');

/**
 * @swagger
 * tags:
 *   name: Reportes
 *   description: Endpoints para generación de reportes
 */

/**
 * @swagger
 * /api/v1/reports/revenue:
 *   get:
 *     summary: Obtener reporte de ingresos
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [día, semana, mes]
 *     responses:
 *       200:
 *         description: Datos del reporte de ingresos
 */
router.get(
  '/revenue',
  [validateDateRange, checkRole(['admin'])],
  reportController.getRevenueReport
);

/**
 * @swagger
 * /api/v1/reports/dentists:
 *   get:
 *     summary: Obtener reporte de desempeño de dentistas
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dentistId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del reporte de desempeño de dentistas
 */
router.get(
  '/dentists',
  [validateDateRange, checkRole(['admin'])],
  reportController.getDentistPerformanceReport
);

/**
 * @swagger
 * /api/v1/reports/treatments:
 *   get:
 *     summary: Obtener reporte de tratamientos populares
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Datos del reporte de tratamientos populares
 */
router.get(
  '/treatments',
  [validateDateRange, checkRole(['admin'])],
  reportController.getPopularTreatmentsReport
);

/**
 * @swagger
 * /api/v1/reports/new-patients:
 *   get:
 *     summary: Obtener reporte de nuevos pacientes
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Datos del reporte de nuevos pacientes
 */
router.get(
  '/new-patients',
  [validateDateRange, checkRole(['admin'])],
  reportController.getNewPatientsReport
);

/**
 * @swagger
 * /api/v1/reports/export/pdf:
 *   get:
 *     summary: Exportar reporte en formato PDF
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: reportType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [ingresos, dentistas, tratamientos]
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Archivo PDF del reporte
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get(
  '/export/pdf',
  [validateDateRange, checkRole(['admin'])],
  reportController.exportReportToPDF
);

/**
 * @swagger
 * /api/v1/reports/export/excel:
 *   get:
 *     summary: Exportar reporte en formato Excel
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: reportType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [ingresos, dentistas, tratamientos]
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Archivo Excel del reporte
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get(
  '/export/excel',
  [validateDateRange, checkRole(['admin'])],
  reportController.exportReportToExcel
);

/**
 * @swagger
 * /api/v1/reports/dashboard:
 *   get:
 *     summary: Obtener estadísticas del tablero
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas del tablero
 */
router.get(
  '/dashboard',
  checkRole(['admin', 'dentist']),
  reportController.getDashboardStats
);

module.exports = router;
