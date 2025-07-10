const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { checkRole } = require('../middleware/index');

/**
 * @swagger
 * tags:
 *   name: Citas
 *   description: Endpoints para la gestión de citas
 */

/**
 * @swagger
 * /api/v1/appointments:
 *   get:
 *     summary: Obtener todas las citas
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Cantidad de resultados por página
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio del filtro
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin del filtro
 *       - in: query
 *         name: dentistId
 *         schema:
 *           type: string
 *         description: ID del dentista
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, cancelled, no-show]
 *         description: Estado de la cita
 *     responses:
 *       200:
 *         description: Lista de citas
 */
router.get('/', appointmentController.getAllAppointments);

/**
 * @swagger
 * /api/v1/appointments/{id}:
 *   get:
 *     summary: Obtener cita por ID
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la cita
 *     responses:
 *       200:
 *         description: Detalles de la cita
 */
router.get('/:id', appointmentController.getAppointment);

/**
 * @swagger
 * /api/v1/appointments:
 *   post:
 *     summary: Crear nueva cita
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EntradaCita'
 *     responses:
 *       201:
 *         description: Cita creada exitosamente
 */
router.post(
  '/',
  [checkRole(['admin', 'receptionist', 'dentist'])],
  appointmentController.createAppointment
);

/**
 * @swagger
 * /api/v1/appointments/{id}:
 *   put:
 *     summary: Actualizar cita
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la cita
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EntradaCita'
 *     responses:
 *       200:
 *         description: Cita actualizada exitosamente
 */
router.put(
  '/:id',
  [checkRole(['admin', 'receptionist', 'dentist'])],
  appointmentController.updateAppointment
);

/**
 * @swagger
 * /api/v1/appointments/{id}/cancel:
 *   patch:
 *     summary: Cancelar cita
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la cita
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Motivo de la cancelación
 *     responses:
 *       200:
 *         description: Cita cancelada exitosamente
 */
router.patch(
  '/:id/cancel',
  checkRole(['admin', 'receptionist', 'dentist']),
  appointmentController.cancelAppointment
);

/**
 * @swagger
 * /api/v1/appointments/{id}/complete:
 *   patch:
 *     summary: Marcar cita como completada
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la cita
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Notas sobre la cita completada
 *     responses:
 *       200:
 *         description: Cita marcada como completada
 */
router.patch(
  '/:id/complete',
  checkRole(['dentist']),
  appointmentController.completeAppointment
);

/**
 * @swagger
 * /api/v1/appointments/availability:
 *   get:
 *     summary: Obtener disponibilidad del dentista
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dentistId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del dentista
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha para consultar disponibilidad
 *     responses:
 *       200:
 *         description: Horarios disponibles
 */
router.get(
  '/availability',
  appointmentController.getDentistAvailability
);

module.exports = router;
