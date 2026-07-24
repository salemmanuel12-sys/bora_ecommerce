const HttpError = require('../utils/httpError');
const https = require('https');

const ENVIATODO_URL = 'https://apiqav2.enviatodo.mx/index.php/Api/add_address';
const ENVIATODO_RATES_URL = 'https://apiqav2.enviatodo.mx/index.php/Api/rates_client';

function getEnviatodoToken() {
  const token = String(process.env.TOKEN_ENVIADO_SECRET || '').trim();

  if (!token) {
    throw new HttpError(500, 'TOKEN_ENVIADO_SECRET no esta configurado.');
  }

  return token;
}

function parseResponseBody(raw = '') {
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function addAddress(payload) {
  const token = getEnviatodoToken();

  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);

    const req = https.request(
      ENVIATODO_URL,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer Token: ${token}`,
          'Content-Type': 'application/json',
          'x-api-key': 'enviatodo',
          'x-enviatodo-app': 'custom',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 10000,
      },
      (res) => {
        let rawBody = '';

        res.on('data', (chunk) => {
          rawBody += chunk;
        });

        res.on('end', () => {
          const parsedBody = parseResponseBody(rawBody);
          const status = res.statusCode || 500;

          if (status < 200 || status >= 300) {
            return reject(
              new HttpError(
                502,
                `No se pudo registrar la direccion en Enviatodo. Status ${status}.`
              )
            );
          }

          return resolve({
            status,
            body: parsedBody || rawBody || null,
          });
        });
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error('timeout'));
    });

    req.on('error', (error) => {
      if (error.message === 'timeout') {
        return reject(new HttpError(504, 'Enviatodo tardo demasiado en responder.'));
      }
      return reject(new HttpError(502, `Error de red con Enviatodo: ${error.message}`));
    });

    req.write(body);
    req.end();
  });
}

async function getRates(payload) {
  const token = getEnviatodoToken();

  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);

    const req = https.request(
      ENVIATODO_RATES_URL,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer Token: ${token}`,
          'Content-Type': 'application/json',
          'x-api-key': 'enviatodo',
          'x-enviatodo-app': 'custom',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 10000,
      },
      (res) => {
        let rawBody = '';

        res.on('data', (chunk) => {
          rawBody += chunk;
        });

        res.on('end', () => {
          const parsedBody = parseResponseBody(rawBody);
          const status = res.statusCode || 500;

          if (status < 200 || status >= 300) {
            return reject(
              new HttpError(
                502,
                `No se pudo cotizar envio en Enviatodo. Status ${status}.`
              )
            );
          }

          return resolve(parsedBody || rawBody || null);
        });
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error('timeout'));
    });

    req.on('error', (error) => {
      if (error.message === 'timeout') {
        return reject(new HttpError(504, 'Enviatodo tardo demasiado en responder.'));
      }
      return reject(new HttpError(502, `Error de red con Enviatodo: ${error.message}`));
    });

    req.write(body);
    req.end();
  });
}

module.exports = { addAddress, getRates };
