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

async function sendResetCode(email, code) {
  const transport = createTransport();

  if (!transport) {
    console.log(`[DEV] Codigo de verificacion para ${email}: ${code}`);
    return;
  }

  await transport.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: 'Codigo de verificacion - Asistencia de Bora',
    text: `Tu codigo de verificacion es: ${code}\nExpira en 15 minutos.\nSi no solicitaste esto, ignora este correo.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Verificacion de identidad</h2>
        <p>Tu codigo de verificacion es:</p>
        <h1 style="letter-spacing:8px;color:#333">${code}</h1>
        <p>Expira en <strong>15 minutos</strong>.</p>
        <p style="color:#999;font-size:12px">Si no solicitaste esto, ignora este correo.</p>
      </div>
    `,
  });
}

module.exports = { sendResetCode };
