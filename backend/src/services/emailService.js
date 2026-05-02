const nodemailer = require('nodemailer');

function createTransport() {
  if (!process.env.EMAIL_HOST) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function sendMailOrLog({ to, subject, html, text }) {
  const transport = createTransport();

  if (!transport) {
    console.log(`[DEV EMAIL] to=${to} subject=${subject}`);
    if (text) {
      console.log(text);
    }
    return;
  }

  await transport.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
    text,
  });
}

async function enviarInvitacionAdmin(email, nombre, token) {
  const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const link = `${frontendBaseUrl}/admin/register/${token}`;

  await sendMailOrLog({
    to: email,
    subject: 'Invitacion para administrador',
    text: `Hola ${nombre}. Completa tu registro en: ${link}`,
    html: `<h3>Hola ${nombre}</h3><p>Completa tu registro como administrador:</p><a href="${link}">${link}</a>`,
  });
}

async function enviarCodigoVerificacion(email, codigo, linkVerificacion) {
  await sendMailOrLog({
    to: email,
    subject: 'Codigo de verificacion',
    text: `Tu codigo es: ${codigo}. Link: ${linkVerificacion || 'N/A'}`,
    html: `<p>Tu codigo de verificacion es:</p><h2>${codigo}</h2>${
      linkVerificacion ? `<p><a href="${linkVerificacion}">${linkVerificacion}</a></p>` : ''
    }`,
  });
}

async function enviarCodigoRecuperacionAdmin(email, codigo, linkVerificacion) {
  await sendMailOrLog({
    to: email,
    subject: 'Codigo de recuperacion',
    text: `Tu codigo de recuperacion es: ${codigo}. Link: ${linkVerificacion || 'N/A'}`,
    html: `<p>Tu codigo de recuperacion es:</p><h2>${codigo}</h2>${
      linkVerificacion ? `<p><a href="${linkVerificacion}">${linkVerificacion}</a></p>` : ''
    }`,
  });
}

async function enviarNotificacionCambioPasswordSuperAdmin(emails, nombreAdmin, emailAdmin) {
  await sendMailOrLog({
    to: emails,
    subject: 'Solicitud de cambio de contrasena',
    text: `Solicitud pendiente de ${nombreAdmin} (${emailAdmin}).`,
    html: `<p>Solicitud pendiente de cambio de contrasena:</p><p>${nombreAdmin} (${emailAdmin})</p>`,
  });
}

module.exports = {
  enviarInvitacionAdmin,
  enviarCodigoVerificacion,
  enviarCodigoRecuperacionAdmin,
  enviarNotificacionCambioPasswordSuperAdmin,
};
