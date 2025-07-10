const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const AppError = require('../utils/appError');
const { sendEmail } = require('../utils/email');
const crypto = require('crypto');

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // 1) Verificar si email y password existen
      if (!email || !password) {
        throw new AppError('Please provide email and password', 400);
      }

      const user = await User.findOne({ 
        where: { email },
        attributes: ['id', 'email', 'password', 'firstName', 'lastName', 'role']
      });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new AppError('Incorrect email or password', 401);
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
      );

      await User.update(
        { refreshToken },
        { where: { id: user.id } }
      );

      user.password = undefined;

      res.status(200).json({
        status: 'success',
        token,
        refreshToken,
        user
      });
    } catch (error) {
      next(error);
    }
  }

  // Registro
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      const userExists = await User.findOne({ where: { email } });
      if (userExists) {
        throw new AppError('User already exists with this email', 400);
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await User.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role
      });

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      user.password = undefined;
      await sendEmail({
        email: user.email,
        subject: 'Welcome to Dental Clinic',
        template: 'welcome',
        data: {
          name: user.firstName
        }
      });
      res.status(201).json({
        status: 'success',
        token,
        user
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new AppError('There is no user with this email address', 404);
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      await User.update({
        passwordResetToken,
        passwordResetExpires: Date.now() + 10 * 60 * 1000 
      }, {
        where: { id: user.id }
      });

      const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      await sendEmail({
        email: user.email,
        subject: 'Your password reset token (valid for 10 min)',
        template: 'passwordReset',
        data: {
          name: user.firstName,
          resetURL
        }
      });

      res.status(200).json({
        status: 'success',
        message: 'Token sent to email'
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;

      // 1) Obtener usuario basado en token
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      const user = await User.findOne({
        where: {
          passwordResetToken: hashedToken,
          passwordResetExpires: {
            [Op.gt]: Date.now()
          }
        }
      });

      if (!user) {
        throw new AppError('Token is invalid or has expired', 400);
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      await User.update({
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      }, {
        where: { id: user.id }
      });

      await sendEmail({
        email: user.email,
        subject: 'Your password has been changed',
        template: 'passwordChanged',
        data: {
          name: user.firstName
        }
      });

      res.status(200).json({
        status: 'success',
        message: 'Password updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError('Please provide refresh token', 400);
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      const user = await User.findOne({ 
        where: { 
          id: decoded.id,
          refreshToken 
        }
      });

      if (!user) {
        throw new AppError('Invalid refresh token', 401);
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.status(200).json({
        status: 'success',
        token
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findByPk(req.user.id);

      if (!(await bcrypt.compare(currentPassword, user.password))) {
        throw new AppError('Your current password is wrong', 401);
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await User.update({
        password: hashedPassword
      }, {
        where: { id: user.id }
      });

      await sendEmail({
        email: user.email,
        subject: 'Your password has been changed',
        template: 'passwordChanged',
        data: {
          name: user.firstName
        }
      });

      res.status(200).json({
        status: 'success',
        message: 'Password updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      await User.update({
        refreshToken: null
      }, {
        where: { id: req.user.id }
      });

      res.status(200).json({
        status: 'success',
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
