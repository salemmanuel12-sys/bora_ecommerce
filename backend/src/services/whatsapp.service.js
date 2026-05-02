/**
 * Servicio de notificaciones WhatsApp via Meta Cloud API.
 *
 * Documentación: https://developers.facebook.com/docs/whatsapp/cloud-api/messages/text-messages
 *
 * Variables de entorno requeridas:
 *   WHATSAPP_TOKEN      → Bearer token de acceso (Panel de Meta for Developers)
 *   WHATSAPP_PHONE_ID   → ID del número de teléfono registrado en Meta
 *   WHATSAPP_NOTIFY_TO  → Número de destino con código de país, sin + (ej: 525522539193)
 *
 * El token NO caduca si es un token de sistema permanente.
 * Para pruebas en sandbox de Meta el formato es el mismo.
 */

const https = require('https');

function getConfig() {
  const enabledByFlag = String(process.env.WHATSAPP_ENABLED || 'true').toLowerCase() !== 'false';

  return {
    token: process.env.WHATSAPP_TOKEN || '',
    phoneId: process.env.WHATSAPP_PHONE_ID || '',
    notifyTo: process.env.WHATSAPP_NOTIFY_TO || '525522539193',
    enabled: enabledByFlag && Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID),
  };
}

function parseErrorBody(raw = '') {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Envía un mensaje de texto a través de la Meta WhatsApp Cloud API.
 * Falla silenciosamente para no interrumpir el flujo de negocio.
 *
 * @param {string} to   Número destino con código de país (sin +). Ej: 525522539193
 * @param {string} body Texto del mensaje
 */
function sendWhatsAppMessage(to, body) {
  return new Promise((resolve) => {
    const { token, phoneId, enabled } = getConfig();

    if (!enabled) {
      console.warn('[WhatsApp] WHATSAPP_TOKEN o WHATSAPP_PHONE_ID no configurados. Mensaje no enviado.');
      return resolve({ ok: false, reason: 'not_configured' });
    }

    const payload = JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { body },
    });

    const options = {
      hostname: 'graph.facebook.com',
      path: `/v19.0/${phoneId}/messages`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.info(`[WhatsApp] Mensaje enviado a ${to} (status ${res.statusCode})`);
          resolve({ ok: true });
        } else {
          const parsed = parseErrorBody(data);
          const metaCode = parsed?.error?.code;
          const metaMessage = parsed?.error?.message;

          if (res.statusCode === 401 || metaCode === 190) {
            console.warn('[WhatsApp] Credenciales invalidas o expiradas (OAuthException code 190).');
            console.warn('[WhatsApp] Actualiza WHATSAPP_TOKEN en .env con un token valido de Meta Cloud API.');
            return resolve({
              ok: false,
              status: res.statusCode,
              reason: 'auth_invalid',
              body: data,
              metaCode,
              metaMessage,
            });
          }

          console.warn(`[WhatsApp] Error ${res.statusCode}: ${data}`);
          resolve({ ok: false, status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => {
      console.warn('[WhatsApp] Error de red:', err.message);
      resolve({ ok: false, error: err.message });
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Notifica al admin cuando se levanta una nueva orden de compra.
 *
 * @param {{ orderId: number, total: number, itemCount: number, userEmail?: string }} order
 */
async function notifyNuevaOrden({ orderId, total, itemCount, userEmail = '' }) {
  const { notifyTo } = getConfig();

  const totalFormatted = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(total);

  const mensaje =
    `🛍️ *Nueva orden de compra — Bora Joyería*\n\n` +
    `📦 Pedido #${orderId}\n` +
    `💳 Total: ${totalFormatted}\n` +
    `🔢 Artículos: ${itemCount}\n` +
    (userEmail ? `👤 Cliente: ${userEmail}\n` : '') +
    `\n✅ Revisa el panel de administración para procesarla.`;

  return sendWhatsAppMessage(notifyTo, mensaje);
}

module.exports = { sendWhatsAppMessage, notifyNuevaOrden };
