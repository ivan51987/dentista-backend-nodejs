const express = require('express');
const router = express.Router();
const dentalRecordController = require('../controllers/dentalRecordController');
const { validateDentalRecord, checkRole } = require('../middleware/index');

/**
 * @swagger
 * tags:
 *   name: Registros Dentales
 *   description: Endpoints para la gestión de registros dentales
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DentalRecord:
 *       type: object
 *       required:
 *         - patientId
 *         - dentistId
 *         - diagnosis
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         patientId:
 *           type: string
 *           format: uuid
 *         dentistId:
 *           type: string
 *           format: uuid
 *         treatmentId:
 *           type: string
 *           format: uuid
 *         date:
 *           type: string
 *           format: date-time
 *         diagnosis:
 *           type: string
 *         procedures:
 *           type: array
 *           items:
 *             type: string
 *         observations:
 *           type: string
 *         teeth:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               number:
 *                 type: integer
 *               condition:
 *                 type: string
 *               treatment:
 *                 type: string
 */

/**
 * @swagger
 * /api/v1/dental-records/patient/{patientId}:
 *   get:
 *     summary: Obtener registros dentales de un paciente
 *     tags: [Registros Dentales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Lista de registros dentales
 */
router.get(
  '/patient/:patientId',
  checkRole(['admin', 'dentist']),
  dentalRecordController.getPatientDentalRecords
);

/**
 * @swagger
 * /api/v1/dental-records:
 *   post:
 *     summary: Crear nuevo registro dental
 *     tags: [Registros Dentales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DentalRecord'
 *     responses:
 *       201:
 *         description: Registro dental creado exitosamente
 */
router.post(
  '/',
  [validateDentalRecord, checkRole(['dentist'])],
  dentalRecordController.createDentalRecord
);

/**
 * @swagger
 * /api/v1/dental-records/{id}:
 *   get:
 *     summary: Obtener registro dental por ID
 *     tags: [Registros Dentales]
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
 *         description: Detalles del registro dental
 */
router.get(
  '/:id',
  checkRole(['admin', 'dentist']),
  dentalRecordController.getDentalRecord
);

/**
 * @swagger
 * /api/v1/dental-records/{id}:
 *   put:
 *     summary: Actualizar registro dental
 *     tags: [Registros Dentales]
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
 *             $ref: '#/components/schemas/DentalRecord'
 *     responses:
 *       200:
 *         description: Registro dental actualizado exitosamente
 */
router.put(
  '/:id',
  [validateDentalRecord, checkRole(['dentist'])],
  dentalRecordController.updateDentalRecord
);

module.exports = router;
