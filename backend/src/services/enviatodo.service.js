const HttpError = require('../utils/httpError');
const https = require('https');

const ENVIATODO_URL = 'https://api.enviatodo.com/index.php/Api/add_address';
const ENVIATODO_DELETE_ADDRESS_URL = 'https://api.enviatodo.com/index.php/Api/delete_address';
const ENVIATODO_GET_ADDRESS_BY_ID_URL = 'https://api.enviatodo.com/index.php/Api/get_address_by_id';
const ENVIATODO_RATES_URL = 'https://api.enviatodo.com/index.php/Api/rates_client';
const ENVIATODO_ADD_PACKAGE_URL = 'https://api.enviatodo.com/index.php/Api/add_package';
const ENVIATODO_GET_PACKAGES_URL = 'https://api.enviatodo.com/index.php/Api/get_packages';
const ENVIATODO_GET_PACKAGE_BY_ID_URL = 'https://api.enviatodo.com/index.php/Api/get_package_by_id';
const ENVIATODO_DELETE_PACKAGE_URL = 'https://api.enviatodo.com/index.php/Api/delete_package';
const ENVIATODO_GET_CATALOG_URL = 'https://api.enviatodo.com/index.php/Api/get_catalog';

function buildAuthHeader(token, mode = 'legacy') {
  if (mode === 'bearer') {
    return `Bearer ${token}`;
  }
  return `Bearer Token: ${token}`;
}

function sanitizeRatesPayload(input) {
  if (Array.isArray(input)) {
    return input.map(sanitizeRatesPayload);
  }

  if (!input || typeof input !== 'object') {
    return input;
  }

  const output = {};
  for (const [key, value] of Object.entries(input)) {
    output[key] = sanitizeRatesPayload(value);
  }

  return output;
}

function getEnviatodoToken() {
  const token = String(
    process.env.TOKEN_ENVIATODO_SECRET || process.env.TOKEN_ENVIATODO_SECRET || process.env.TOKEN_ENVIADO_SECRET || ''
  ).trim();

  if (!token) {
    throw new HttpError(
      500,
      'Token de Enviatodo no configurado. Define TOKEN_ENVIADO_SECRET (o TOKEN_ENVIATODO_SECRET).'
    );
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

function formatUpstreamDetail(parsedBody, rawBody) {
  if (typeof parsedBody === 'string') {
    return parsedBody;
  }

  if (parsedBody) {
    return JSON.stringify(parsedBody);
  }

  return rawBody || '';
}

function requestEnviatodo({
  url,
  method = 'GET',
  payload = null,
  token,
  authMode = 'legacy',
  timeout = 10000,
}) {
  return new Promise((resolve, reject) => {
    const hasBody = payload !== null && payload !== undefined;
    const body = hasBody ? JSON.stringify(payload) : '';

    const headers = {
      Authorization: buildAuthHeader(token, authMode),
      'x-api-key': 'enviatodo',
      'x-enviatodo-app': 'custom',
    };

    if (hasBody) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = https.request(
      url,
      {
        method,
        headers,
        timeout,
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
            return reject({
              type: 'upstream-status',
              status,
              parsedBody,
              rawBody,
              authMode,
            });
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

    if (hasBody) {
      req.write(body);
    }

    req.end();
  });
}

async function requestEnviatodoWithFallback({ url, method = 'GET', payload = null, operation }) {
  const token = getEnviatodoToken();

 
  try {
    return await requestEnviatodo({
      url,
      method,
      payload,
      token,
      authMode: 'legacy',
    });
  } catch (error) {
    const canRetryWithBearer =
      error
      && error.type === 'upstream-status'
      && (error.status === 401 || error.status === 403)
      && error.authMode === 'legacy';

    if (canRetryWithBearer) {
      try {
        return await requestEnviatodo({
          url,
          method,
          payload,
          token,
          authMode: 'bearer',
        });
      } catch (retryError) {
        const detail = formatUpstreamDetail(retryError?.parsedBody, retryError?.rawBody);
        throw new HttpError(
          502,
          `No se pudo ${operation} en Enviatodo. Status ${retryError?.status || error.status}. ${detail ? `Detalle: ${detail}` : ''}`
        );
      }
    }

    if (error instanceof HttpError) {
      throw error;
    }

    const detail = formatUpstreamDetail(error?.parsedBody, error?.rawBody);
    throw new HttpError(
      502,
      `No se pudo ${operation} en Enviatodo. Status ${error?.status || 500}. ${detail ? `Detalle: ${detail}` : ''}`
    );
  }
}

async function addAddress(payload) {
  const result = await requestEnviatodoWithFallback({
    url: ENVIATODO_URL,
    method: 'POST',
    payload,
    operation: 'registrar la direccion',
  });

  return result.body;
}

async function deleteAddress(addressId) {
  const numericId = Number(addressId);

  try {
    const result = await requestEnviatodoWithFallback({
      url: ENVIATODO_DELETE_ADDRESS_URL,
      method: 'POST',
      payload: { id: Number.isFinite(numericId) ? numericId : String(addressId) },
      operation: 'eliminar la direccion',
    });

    return result.body;
  } catch (error) {
    // Compatibilidad: algunas cuentas esperan address_id en vez de id.
    const fallbackResult = await requestEnviatodoWithFallback({
      url: ENVIATODO_DELETE_ADDRESS_URL,
      method: 'POST',
      payload: { address_id: String(addressId) },
      operation: 'eliminar la direccion',
    });

    return fallbackResult.body;
  }
}

async function getAddressById(addressId) {
  const safeId = encodeURIComponent(String(addressId));
  const result = await requestEnviatodoWithFallback({
    url: `${ENVIATODO_GET_ADDRESS_BY_ID_URL}/${safeId}`,
    method: 'GET',
    operation: 'obtener la direccion por id',
  });

  return result.body;
}

function requestRatesWithAuth(payload, token, authMode) {
  return new Promise((resolve, reject) => {
    const sanitizedPayload = sanitizeRatesPayload(payload);

    console.log(
      "ENVIANDO A ENVIATODO",
      JSON.stringify(sanitizedPayload, null, 2)
    );
    const body = JSON.stringify(sanitizedPayload, (key, value) => {
      return value;
    });

    const req = https.request(
      ENVIATODO_RATES_URL,
      {
        method: 'POST',
        headers: {
          Authorization: buildAuthHeader(token, authMode),
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
            return reject({
              type: 'upstream-status',
              status,
              parsedBody,
              rawBody,
              authMode,
            });
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

async function getRates(payload) {
  const token = getEnviatodoToken();

  try {
    return await requestRatesWithAuth(payload, token, 'legacy');
  } catch (error) {
    const canRetryWithBearer =
      error
      && error.type === 'upstream-status'
      && (error.status === 401 || error.status === 403)
      && error.authMode === 'legacy';

    if (canRetryWithBearer) {
      try {
        return await requestRatesWithAuth(payload, token, 'bearer');
      } catch (retryError) {
        const detail =
          typeof retryError?.parsedBody === 'string'
            ? retryError.parsedBody
            : retryError?.parsedBody
              ? JSON.stringify(retryError.parsedBody)
              : retryError?.rawBody || '';
        throw new HttpError(
          502,
          `No se pudo cotizar envio en Enviatodo. Status ${retryError?.status || error.status}. ${detail ? `Detalle: ${detail}` : ''}`
        );
      }
    }

    if (error instanceof HttpError) {
      throw error;
    }

    const detail =
      typeof error?.parsedBody === 'string'
        ? error.parsedBody
        : error?.parsedBody
          ? JSON.stringify(error.parsedBody)
          : error?.rawBody || '';

    throw new HttpError(
      502,
      `No se pudo cotizar envio en Enviatodo. Status ${error?.status || 500}. ${detail ? `Detalle: ${detail}` : ''}`
    );
  }
}

async function addPackage(payload) {
  const result = await requestEnviatodoWithFallback({
    url: ENVIATODO_ADD_PACKAGE_URL,
    method: 'POST',
    payload,
    operation: 'crear el paquete',
  });

  return result.body;
}

async function getPackages() {
  const result = await requestEnviatodoWithFallback({
    url: ENVIATODO_GET_PACKAGES_URL,
    method: 'GET',
    operation: 'obtener la lista de paquetes',
  });

  return result.body;
}

async function getPackageById(packageId) {
  const safeId = encodeURIComponent(String(packageId));
  const result = await requestEnviatodoWithFallback({
    url: `${ENVIATODO_GET_PACKAGE_BY_ID_URL}/${safeId}`,
    method: 'GET',
    operation: 'obtener el paquete por id',
  });

  return result.body;
}

async function deletePackage(packageId) {
  const safeId = encodeURIComponent(String(packageId));
  const result = await requestEnviatodoWithFallback({
    url: `${ENVIATODO_DELETE_PACKAGE_URL}/${safeId}`,
    method: 'GET',
    operation: 'eliminar el paquete',
  });

  return result.body;
}

async function getCatalog(catalogCode) {
  const safeCode = encodeURIComponent(String(catalogCode || '').trim());
  const result = await requestEnviatodoWithFallback({
    url: `${ENVIATODO_GET_CATALOG_URL}/${safeCode}`,
    method: 'GET',
    operation: `obtener el catalogo ${safeCode}`,
  });

  return result.body;
}

module.exports = {
  addAddress,
  deleteAddress,
  getAddressById,
  getRates,
  addPackage,
  getPackages,
  getPackageById,
  deletePackage,
  getCatalog,
};
