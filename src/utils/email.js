const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,  
  port: process.env.EMAIL_PORT,  
  secure: process.env.EMAIL_SECURE === 'true', 
  auth: {
    user: process.env.EMAIL_USER,      
    pass: process.env.EMAIL_PASS       
  }
});

exports.sendEmail = async (options) => {
  try {
    let htmlContent = options.html;

    if (options.template) {
      const templatePath = path.join(__dirname, `../templates/${options.template}.ejs`);
      htmlContent = await ejs.renderFile(templatePath, options.data || {});
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.email,
      subject: options.subject,
      text: options.message || undefined,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error al enviar el correo:', error.message);
    throw new Error('No se pudo enviar el correo.');
  }
};

exports.sendWelcomeEmail = async (user) => {
  await this.sendEmail({
    email: user.email,
    subject: 'Bienvenido a nuestra clínica dental',
    html: `
      <h1>Bienvenido ${user.firstName}!</h1>
      <p>Nos alegra tenerte como parte de nuestra clínica.</p>
      <p>Tu cuenta ha sido creada exitosamente.</p>
    `
  });
};

exports.sendPasswordResetEmail = async (user, resetURL) => {
  await this.sendEmail({
    email: user.email,
    subject: 'Recuperación de contraseña',
    html: `
      <h1>Recuperación de contraseña</h1>
      <p>Has solicitado restablecer tu contraseña.</p>
      <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
      <a href="${resetURL}">Restablecer contraseña</a>
      <p>Este enlace expirará en 10 minutos.</p>
      <p>Si no solicitaste este cambio, ignora este correo.</p>
    `
  });
};