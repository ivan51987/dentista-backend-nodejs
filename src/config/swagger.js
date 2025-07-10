const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Clínica Dental',
      version: '1.0.0',
      description: 'Documentación de la API del Sistema de Gestión de Clínica Dental'
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000/',
        description: 'Servidor de desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Paciente: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            nombres: { type: 'string', example: 'Juan' },
            apellidos: { type: 'string', example: 'Pérez' },
            correo: { type: 'string', format: 'email', example: 'juan@example.com' },
            dni: { type: 'string', example: '12345678' },
            telefono: { type: 'string', example: '76543210' },
            direccion: { type: 'string', example: 'Av. Siempre Viva 742' },
            fechaCreacion: { type: 'string', format: 'date-time' },
            fechaActualizacion: { type: 'string', format: 'date-time' }
          }
        },

        EntradaPaciente: {
          type: 'object',
          required: ['nombres', 'apellidos', 'correo', 'dni'],
          properties: {
            nombres: { type: 'string', example: 'Juan' },
            apellidos: { type: 'string', example: 'Pérez' },
            correo: { type: 'string', format: 'email', example: 'juan@example.com' },
            dni: { type: 'string', example: '12345678' },
            telefono: { type: 'string', example: '76543210' },
            direccion: { type: 'string', example: 'Av. Siempre Viva 742' }
          }
        },

        Cita: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            pacienteId: { type: 'string', format: 'uuid' },
            dentistaId: { type: 'string', format: 'uuid' },
            tratamientoId: { type: 'string', format: 'uuid' },
            fecha: { type: 'string', format: 'date-time', example: '2025-07-01T10:00:00Z' },
            estado: { type: 'string', enum: ['pendiente', 'completado', 'cancelado'], example: 'completado' },
            observaciones: { type: 'string', example: 'Paciente respondió bien al tratamiento' },
            fechaCreacion: { type: 'string', format: 'date-time' },
            fechaActualizacion: { type: 'string', format: 'date-time' },
            tratamiento: { $ref: '#/components/schemas/Tratamiento' },
            dentista: {
              type: 'object',
              properties: {
                nombres: { type: 'string' },
                apellidos: { type: 'string' }
              }
            }
          }
        },

        EntradaCita: {
          type: 'object',
          required: ['pacienteId', 'dentistaId', 'tratamientoId', 'fecha'],
          properties: {
            pacienteId: { type: 'string', format: 'uuid' },
            dentistaId: { type: 'string', format: 'uuid' },
            tratamientoId: { type: 'string', format: 'uuid' },
            fecha: { type: 'string', format: 'date-time', example: '2025-07-01T10:00:00Z' },
            observaciones: { type: 'string', example: 'Revisión general solicitada' }
          }
        },

        Tratamiento: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            nombre: { type: 'string', example: 'Limpieza dental' },
            descripcion: { type: 'string', example: 'Eliminación de placa y sarro' },
            costo: { type: 'number', format: 'float', example: 120.50 },
            duracion: { type: 'integer', example: 30, description: 'Duración en minutos' },
            fechaCreacion: { type: 'string', format: 'date-time' },
            fechaActualizacion: { type: 'string', format: 'date-time' }
          }
        },

        HistorialDental: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            pacienteId: { type: 'string', format: 'uuid' },
            fecha: { type: 'string', format: 'date', example: '2025-06-19' },
            diagnostico: { type: 'string', example: 'Caries en molar superior derecho' },
            notas: { type: 'string', example: 'Requiere seguimiento en 3 semanas' },
            fechaCreacion: { type: 'string', format: 'date-time' },
            fechaActualizacion: { type: 'string', format: 'date-time' }
          }
        },

        RespuestaError: {
          type: 'object',
          properties: {
            estado: { type: 'string', example: 'error' },
            mensaje: { type: 'string', example: 'Paciente no encontrado' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

module.exports = swaggerJSDoc(options);
