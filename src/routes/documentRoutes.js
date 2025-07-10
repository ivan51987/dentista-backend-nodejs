const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { upload } = require('../middleware/upload');
const { validateDocument, checkRole } = require('../middleware/index');

/**
 * @swagger
 * tags:
 *   name: Documentos
 *   description: Endpoints para la gestión de documentos
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Document:
 *       type: object
 *       required:
 *         - patientId
 *         - type
 *         - file
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         patientId:
 *           type: string
 *           format: uuid
 *         type:
 *           type: string
 *           enum: [xray, image, prescription, report, consent, other]
 *         description:
 *           type: string
 *         fileName:
 *           type: string
 *         fileType:
 *           type: string
 *         size:
 *           type: number
 *         uploadedById:
 *           type: string
 *           format: uuid
 */

/**
 * @swagger
 * /api/v1/documents/patient/{patientId}:
 *   get:
 *     summary: Obtener documentos de un paciente
 *     tags: [Documentos]
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
 *         name: type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de documentos
 */
router.get(
  '/patient/:patientId',
  checkRole(['admin', 'dentist']),
  documentController.getPatientDocuments
);

/**
 * @swagger
 * /api/v1/documents:
 *   post:
 *     summary: Subir nuevo documento
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - type
 *               - file
 *             properties:
 *               patientId:
 *                 type: string
 *               type:
 *                 type: string
 *               description:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Documento subido exitosamente
 */
router.post(
  '/',
  [
    upload.single('file'),
    validateDocument,
    checkRole(['admin', 'dentist'])
  ],
  documentController.uploadDocument
);

/**
 * @swagger
 * /api/v1/documents/{id}:
 *   get:
 *     summary: Obtener documento por ID
 *     tags: [Documentos]
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
 *         description: Detalles del documento
 */
router.get(
  '/:id',
  checkRole(['admin', 'dentist']),
  documentController.getDocument
);

/**
 * @swagger
 * /api/v1/documents/{id}:
 *   put:
 *     summary: Actualizar documento
 *     tags: [Documentos]
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
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Documento actualizado exitosamente
 */
router.put(
  '/:id',
  checkRole(['admin', 'dentist']),
  documentController.updateDocument
);

/**
 * @swagger
 * /api/v1/documents/{id}:
 *   delete:
 *     summary: Eliminar documento
 *     tags: [Documentos]
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
 *         description: Documento eliminado exitosamente
 */
router.delete(
  '/:id',
  checkRole(['admin', 'dentist']),
  documentController.deleteDocument
);

module.exports = router;
