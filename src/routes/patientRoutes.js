const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { validatePatient, checkRole } = require('../middleware/index');

/**
 * @swagger
 * tags:
 *   name: Pacientes
 *   description: Endpoints para la gestión de pacientes
 */

/**
 * @swagger
 * /api/v1/patients:
 *   get:
 *     summary: Obtener todos los pacientes
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *     responses:
 *       200:
 *         description: Lista de pacientes
 */
router.get('/', patientController.getAllPatients);

/**
 * @swagger
 * /api/v1/patients/{id}:
 *   get:
 *     summary: Obtener paciente por ID
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalles del paciente
 *       404:
 *         description: Paciente no encontrado
 */
router.get('/:id', patientController.getPatient);

/**
 * @swagger
 * /api/v1/patients:
 *   post:
 *     summary: Crear nuevo paciente
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PatientInput'
 *     responses:
 *       201:
 *         description: Paciente creado exitosamente
 */
router.post(
  '/',
  [validatePatient, checkRole(['admin', 'receptionist'])],
  patientController.createPatient
);

/**
 * @swagger
 * /api/v1/patients/{id}:
 *   put:
 *     summary: Actualizar paciente
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PatientInput'
 *     responses:
 *       200:
 *         description: Paciente actualizado exitosamente
 */
router.put(
  '/:id',
  [validatePatient, checkRole(['admin', 'receptionist'])],
  patientController.updatePatient
);

/**
 * @swagger
 * /api/v1/patients/{id}:
 *   delete:
 *     summary: Eliminar paciente
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paciente eliminado exitosamente
 */
router.delete(
  '/:id',
  checkRole(['admin']),
  patientController.deletePatient
);

/**
 * @swagger
 * /api/v1/patients/{id}/appointments:
 *   get:
 *     summary: Obtener citas del paciente
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Citas del paciente
 */
router.get(
  '/:id/appointments',
  patientController.getPatientAppointments
);

/**
 * @swagger
 * /api/v1/patients/{id}/stats:
 *   get:
 *     summary: Obtener estadísticas del paciente
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estadísticas del paciente
 */
router.get(
  '/:id/stats',
  patientController.getPatientStats
);

module.exports = router;
