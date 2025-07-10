const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const path = require('path');
require('dotenv').config();

// Importación de rutas
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const treatmentRoutes = require('./routes/treatmentRoutes');
const userRoutes = require('./routes/userRoutes');
const dentalRecordRoutes = require('./routes/dentalRecordRoutes');
const documentRoutes = require('./routes/documentRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Importación de middlewares
const errorHandler = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/index');
const logger = require('./utils/logger');

// Inicialización de la aplicación
const app = express();

// Configuración de seguridad
app.use(helmet());

// Configuración de CORS
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400 // 24 horas
};
app.use(cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por ventana
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Middleware de parseo
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Directorio estático para archivos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Rutas base
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/patients', authenticateToken, patientRoutes);
app.use('/api/v1/appointments', authenticateToken, appointmentRoutes);
app.use('/api/v1/treatments', authenticateToken, treatmentRoutes);
app.use('/api/v1/users', authenticateToken, userRoutes);
app.use('/api/v1/dental-records', authenticateToken, dentalRecordRoutes);
app.use('/api/v1/documents', authenticateToken, documentRoutes);
app.use('/api/v1/reports', authenticateToken, reportRoutes);

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Manejo global de errores
app.use(errorHandler);

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  process.exit(1);
});

// Conexión a la base de datos
const sequelize = require('./config/database');
sequelize.authenticate()
  .then(() => {
    logger.info('Database connection has been established successfully.');
  })
  .catch(err => {
    logger.error('Unable to connect to the database:', err);
  });

// Sincronización de modelos (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  sequelize.sync({ alter: true })
    .then(() => {
      logger.info('Database synchronized');
    })
    .catch(err => {
      logger.error('Error synchronizing database:', err);
    });
}

// Iniciar servidor
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated!');
  });
});

module.exports = app;