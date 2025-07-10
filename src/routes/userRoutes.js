const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateUser, validatePassword, validateWorkingHours, checkRole, checkSelfOrAdmin } = require('../middleware/index');

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Endpoints para gestión de usuarios
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - password
 *         - role
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         role:
 *           type: string
 *           enum: [admin, dentist, assistant, receptionist]
 *         specialization:
 *           type: string
 *         workingHours:
 *           type: object
 *         status:
 *           type: string
 *           enum: [activo, inactivo]
 */

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Obtener todos los usuarios
 *     tags: [Usuarios]
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
 *         name: role
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de usuarios
 */
router.get(
  '/',
  checkRole(['admin']),
  userController.getAllUsers
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Usuarios]
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
 *         description: Detalles del usuario
 */
router.get(
  '/:id',
  checkSelfOrAdmin,
  userController.getUser
);

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Crear nuevo usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 */
router.post(
  '/',
  [validateUser, checkRole(['admin'])],
  userController.createUser
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   put:
 *     summary: Actualizar usuario
 *     tags: [Usuarios]
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
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 */
router.put(
  '/:id',
  [validateUser, checkSelfOrAdmin],
  userController.updateUser
);

/**
 * @swagger
 * /api/v1/users/{id}/change-password:
 *   put:
 *     summary: Cambiar contraseña de usuario
 *     tags: [Usuarios]
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
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña cambiada exitosamente
 */
router.put(
  '/:id/change-password',
  [validatePassword, checkSelfOrAdmin],
  userController.changePassword
);

/**
 * @swagger
 * /api/v1/users/{id}/deactivate:
 *   patch:
 *     summary: Desactivar usuario
 *     tags: [Usuarios]
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
 *         description: Usuario desactivado exitosamente
 */
router.patch(
  '/:id/deactivate',
  checkRole(['admin']),
  userController.deactivateUser
);

/**
 * @swagger
 * /api/v1/users/{id}/working-hours:
 *   get:
 *     summary: Obtener horario laboral del usuario
 *     tags: [Usuarios]
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
 *         description: Horario laboral del usuario
 */
router.get(
  '/:id/working-hours',
  userController.getWorkingHours
);

/**
 * @swagger
 * /api/v1/users/{id}/working-hours:
 *   put:
 *     summary: Actualizar horario laboral del usuario
 *     tags: [Usuarios]
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
 *               monday:
 *                 type: object
 *                 properties:
 *                   start: 
 *                     type: string
 *                   end:
 *                     type: string
 *     responses:
 *       200:
 *         description: Horario laboral actualizado exitosamente
 */
router.put(
  '/:id/working-hours',
  [validateWorkingHours, checkSelfOrAdmin],
  userController.updateWorkingHours
);

/**
 * @swagger
 * /api/v1/users/{id}/stats:
 *   get:
 *     summary: Obtener estadísticas del usuario
 *     tags: [Usuarios]
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
 *         description: Estadísticas del usuario
 */
router.get(
  '/:id/stats',
  checkSelfOrAdmin,
  userController.getUserStats
);

module.exports = router;
