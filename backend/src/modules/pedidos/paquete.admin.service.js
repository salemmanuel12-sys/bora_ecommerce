const HttpError = require('../../utils/httpError');
const {
  addPackage: addPackageToEnviatodo,
  getPackages: getPackagesFromEnviatodo,
  getPackageById: getPackageByIdFromEnviatodo,
  deletePackage: deletePackageFromEnviatodo,
  getCatalog: getCatalogFromEnviatodo,
} = require('../../services/enviatodo.service');

function parsePackageId(value) {
  const parsed = Number.parseInt(String(value || ''), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, 'Id de paquete invalido.');
  }
  return parsed;
}

async function createPackage(payload) {
  return addPackageToEnviatodo(payload);
}

async function listPackages() {
  return getPackagesFromEnviatodo();
}

async function getPackageById(packageId) {
  const parsedId = parsePackageId(packageId);
  return getPackageByIdFromEnviatodo(parsedId);
}

async function deletePackage(packageId) {
  const parsedId = parsePackageId(packageId);
  return deletePackageFromEnviatodo(parsedId);
}

function normalizeCatalogItems(rawCatalog) {
  const rows = [];

  // Estructura principal esperada por EnviaTodo: { data: { items: [{ key, value }] } }
  if (Array.isArray(rawCatalog?.data?.items)) {
    rows.push(...rawCatalog.data.items);
  } else if (Array.isArray(rawCatalog?.items)) {
    rows.push(...rawCatalog.items);
  } else if (Array.isArray(rawCatalog?.data)) {
    rows.push(...rawCatalog.data);
  } else if (Array.isArray(rawCatalog?.response)) {
    rows.push(...rawCatalog.response);
  } else if (Array.isArray(rawCatalog)) {
    rows.push(...rawCatalog);
  }

  return rows
    .map((item) => {
      if (!item || typeof item !== 'object') return null;

      const key = item.key ?? item.KEY;
      const value = item.value ?? item.VALUE;

      if (key === undefined || value === undefined || key === null || value === null) {
        return null;
      }

      return {
        key: String(key).trim(),
        value: String(value).trim(),
      };
    })
    .filter((item) => item && item.key && item.value);
}

async function getProductTypeCatalog() {
  const raw = await getCatalogFromEnviatodo('pts');
  return normalizeCatalogItems(raw);
}

async function getUnitTypeCatalog() {
  const raw = await getCatalogFromEnviatodo('pkt');
  return normalizeCatalogItems(raw);
}

module.exports = {
  createPackage,
  listPackages,
  getPackageById,
  deletePackage,
  getProductTypeCatalog,
  getUnitTypeCatalog,
};