const { Document, Patient, User } = require('../models');
const AppError = require('../utils/appError');
const { uploadToS3, deleteFromS3 } = require('../utils/s3');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

class DocumentController {
  // Obtener todos los documentos de un paciente
  async getPatientDocuments(req, res, next) {
    try {
      const { patientId } = req.params;
      const { page = 1, limit = 10, type } = req.query;

      const offset = (page - 1) * limit;

      let whereClause = { patientId };
      if (type) {
        whereClause.type = type;
      }

      const documents = await Document.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            as: 'uploadedBy',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      });

      // Generar URLs firmadas para cada documento
      const documentsWithUrls = await Promise.all(
        documents.rows.map(async (doc) => {
          const signedUrl = await this.generateSignedUrl(doc.path);
          return {
            ...doc.toJSON(),
            signedUrl
          };
        })
      );

      res.status(200).json({
        status: 'success',
        data: {
          documents: documentsWithUrls,
          total: documents.count,
          totalPages: Math.ceil(documents.count / limit),
          currentPage: parseInt(page)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Subir nuevo documento
  async uploadDocument(req, res, next) {
    try {
      if (!req.file) {
        throw new AppError('Please provide a file', 400);
      }

      const { patientId, type, description } = req.body;

      // Verificar si el paciente existe
      const patient = await Patient.findByPk(patientId);
      if (!patient) {
        throw new AppError('Patient not found', 404);
      }

      let processedFile = req.file.buffer;
      let fileKey = `${patientId}/${type}/${uuidv4()}-${req.file.originalname}`;

      // Procesar imagen si es necesario
      if (req.file.mimetype.startsWith('image')) {
        processedFile = await sharp(req.file.buffer)
          .resize(1200, 1200, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 80 })
          .toBuffer();
      }

      // Subir a S3
      const uploadResult = await uploadToS3(processedFile, fileKey, req.file.mimetype);

      // Crear registro en la base de datos
      const document = await Document.create({
        patientId,
        type,
        description,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        path: fileKey,
        size: processedFile.length,
        uploadedById: req.user.id
      });

      // Obtener URL firmada para el documento
      const signedUrl = await this.generateSignedUrl(fileKey);

      res.status(201).json({
        status: 'success',
        data: {
          ...document.toJSON(),
          signedUrl
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Actualizar documento
  async updateDocument(req, res, next) {
    try {
      const document = await Document.findByPk(req.params.id);

      if (!document) {
        throw new AppError('Document not found', 404);
      }

      // Verificar permisos
      if (document.uploadedById !== req.user.id && req.user.role !== 'admin') {
        throw new AppError('Not authorized to update this document', 403);
      }

      const { description, type } = req.body;

      await document.update({
        description,
        type
      });

      const signedUrl = await this.generateSignedUrl(document.path);

      res.status(200).json({
        status: 'success',
        data: {
          ...document.toJSON(),
          signedUrl
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Eliminar documento
  async deleteDocument(req, res, next) {
    try {
      const document = await Document.findByPk(req.params.id);

      if (!document) {
        throw new AppError('Document not found', 404);
      }

      // Verificar permisos
      if (document.uploadedById !== req.user.id && req.user.role !== 'admin') {
        throw new AppError('Not authorized to delete this document', 403);
      }

      // Eliminar de S3
      await deleteFromS3(document.path);

      // Eliminar de la base de datos
      await document.destroy();

      res.status(200).json({
        status: 'success',
        message: 'Document deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Generar URL firmada para visualización
  async generateSignedUrl(fileKey) {
    const s3 = new AWS.S3();
    const signedUrl = await s3.getSignedUrlPromise('getObject', {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
      Expires: 3600 // URL válida por 1 hora
    });
    return signedUrl;
  }

  // Obtener documento específico
  async getDocument(req, res, next) {
    try {
      const document = await Document.findByPk(req.params.id, {
        include: [
          {
            model: User,
            as: 'uploadedBy',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      });

      if (!document) {
        throw new AppError('Document not found', 404);
      }

      const signedUrl = await this.generateSignedUrl(document.path);

      res.status(200).json({
        status: 'success',
        data: {
          ...document.toJSON(),
          signedUrl
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DocumentController();