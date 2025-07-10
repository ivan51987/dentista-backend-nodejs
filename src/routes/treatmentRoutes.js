const express = require('express');
const router = express.Router();
const treatmentController = require('../controllers/treatmentController');
const { validateTreatment, checkRole } = require('../middleware/index');

/**
 * @swagger
 * tags:
 *   name: Tratamientos
 *   description: Endpoints para gestión de tratamientos
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Treatment:
 *       type: object
 *       required:
 *         - name
 *         - cost
 *         - duration
 *         - category
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         cost:
 *           type: number
 *         duration:
 *           type: integer
 *           description: Duración en minutos
 *         category:
 *           type: string
 *         requirements:
 *           type: array
 *           items:
 *             type: string
 *         aftercare:
 *           type: array
 *           items:
 *             type: string
 *         status:
 *           type: string
 *           enum: [activo, inactivo]
 */

/**
 * @swagger
 * /api/v1/treatments:
 *   get:
 *     summary: Obtener todos los tratamientos
 *     tags: [Tratamientos]
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
 *         name: category
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
 *         description: Lista de tratamientos
 */
router.get('/', treatmentController.getAllTreatments);

/**
 * @swagger
 * /api/v1/treatments/{id}:
 *   get:
 *     summary: Obtener tratamiento por ID
 *     tags: [Tratamientos]
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
 *         description: Detalles del tratamiento
 */
router.get('/:id', treatmentController.getTreatment);

/**
 * @swagger
 * /api/v1/treatments:
 *   post:
 *     summary: Crear nuevo tratamiento
 *     tags: [Tratamientos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Treatment'
 *     responses:
 *       201:
 *         description: Tratamiento creado exitosamente
 */
router.post(
  '/',
  [validateTreatment, checkRole(['admin'])],
  treatmentController.createTreatment
);

/**
 * @swagger
 * /api/v1/treatments/{id}:
 *   put:
 *     summary: Actualizar tratamiento
 *     tags: [Tratamientos]
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
 *             $ref: '#/components/schemas/Treatment'
 *     responses:
 *       200:
 *         description: Tratamiento actualizado exitosamente
 */
router.put(
  '/:id',
  [validateTreatment, checkRole(['admin'])],
  treatmentController.updateTreatment
);

/**
 * @swagger
 * /api/v1/treatments/{id}/deactivate:
 *   patch:
 *     summary: Desactivar tratamiento
 *     tags: [Tratamientos]
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
 *         description: Tratamiento desactivado exitosamente
 */
router.patch(
  '/:id/deactivate',
  checkRole(['admin']),
  treatmentController.deactivateTreatment
);

/**
 * @swagger
 * /api/v1/treatments/categories/{category}:
 *   get:
 *     summary: Obtener tratamientos por categoría
 *     tags: [Tratamientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de tratamientos en la categoría
 */
router.get(
  '/categories/:category',
  treatmentController.getTreatmentsByCategory
);

/**
 * @swagger
 * /api/v1/treatments/categories:
 *   get:
 *     summary: Obtener todas las categorías de tratamientos
 *     tags: [Tratamientos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de categorías de tratamientos
 */
router.get(
  '/categories',
  treatmentController.getCategories
);

module.exports = router;
