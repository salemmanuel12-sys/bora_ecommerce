const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const { Banner } = require('../../models/loader');
const HttpError = require('../../utils/httpError');

const BANNER_UPLOAD_DIR = path.join(__dirname, '..', '..', '..', 'uploadsBanner');

function sanitizeText(value = '', maxLength = 255) {
  return String(value).trim().replace(/[<>"'&]/g, '').slice(0, maxLength);
}

function parseBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();

  if (['true', '1'].includes(normalized)) {
    return true;
  }

  if (['false', '0'].includes(normalized)) {
    return false;
  }

  return fallback;
}

function toPublicBanner(banner) {
  const item = banner?.get ? banner.get({ plain: true }) : banner;

  return {
    id: item.id,
    uuid: item.uuid,
    title: item.title,
    description: item.description,
    imageUrl: item.imageUrl,
    ctaText: item.ctaText,
    ctaLink: item.ctaLink,
    orden: item.orden,
    status: Boolean(item.status),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function safeDeleteBannerImage(fileName) {
  if (!fileName) {
    return;
  }

  const resolved = path.resolve(BANNER_UPLOAD_DIR, fileName);
  const root = path.resolve(BANNER_UPLOAD_DIR);

  if (!resolved.startsWith(root)) {
    return;
  }

  if (fs.existsSync(resolved)) {
    fs.unlinkSync(resolved);
  }
}

async function listBanners({ page = 1, limit = 10, search = '', includeInactive = false } = {}) {
  const parsedPage = Math.max(1, Number.parseInt(String(page), 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, Number.parseInt(String(limit), 10) || 10));
  const offset = (parsedPage - 1) * parsedLimit;

  const where = {};

  if (!parseBoolean(includeInactive, false)) {
    where.status = true;
  }

  const cleanSearch = sanitizeText(search || '', 140);
  if (cleanSearch) {
    where[Op.or] = [
      { title: { [Op.like]: `%${cleanSearch}%` } },
      { description: { [Op.like]: `%${cleanSearch}%` } },
    ];
  }

  const { count, rows } = await Banner.findAndCountAll({
    where,
    order: [['orden', 'ASC'], ['id', 'DESC']],
    limit: parsedLimit,
    offset,
  });

  return {
    banners: rows.map(toPublicBanner),
    pagination: {
      total: count,
      page: parsedPage,
      limit: parsedLimit,
      pages: Math.max(1, Math.ceil(count / parsedLimit)),
    },
  };
}

async function listPublicBanners() {
  const rows = await Banner.findAll({
    where: { status: true },
    order: [['orden', 'ASC'], ['id', 'DESC']],
  });

  return rows.map(toPublicBanner);
}

async function getBannerById(bannerId) {
  const parsedBannerId = Number.parseInt(String(bannerId), 10);

  if (!Number.isInteger(parsedBannerId) || parsedBannerId <= 0) {
    throw new HttpError(400, 'Id de banner invalido.');
  }

  const banner = await Banner.findByPk(parsedBannerId);

  if (!banner) {
    throw new HttpError(404, 'Banner no encontrado.');
  }

  return toPublicBanner(banner);
}

function normalizeOptionalText(value, maxLength) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text ? text.slice(0, maxLength) : null;
}

function normalizeOptionalNumber(value, fallback = 0) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function createBanner({ title, description, ctaText, ctaLink, orden = 0, status = true, file }) {
  if (!file?.filename) {
    throw new HttpError(400, 'La imagen del banner es obligatoria.');
  }

  const banner = await Banner.create({
    title: normalizeOptionalText(title, 140) || 'Banner',
    description: normalizeOptionalText(description, 280),
    imageUrl: file.filename,
    ctaText: normalizeOptionalText(ctaText, 80),
    ctaLink: normalizeOptionalText(ctaLink, 500),
    orden: normalizeOptionalNumber(orden, 0),
    status: Boolean(status),
  });

  return toPublicBanner(banner);
}

async function updateBanner({ bannerId, title, description, ctaText, ctaLink, orden, status, file }) {
  const parsedBannerId = Number.parseInt(String(bannerId), 10);

  if (!Number.isInteger(parsedBannerId) || parsedBannerId <= 0) {
    throw new HttpError(400, 'Id de banner invalido.');
  }

  const banner = await Banner.findByPk(parsedBannerId);

  if (!banner) {
    if (file?.filename) {
      safeDeleteBannerImage(file.filename);
    }
    throw new HttpError(404, 'Banner no encontrado.');
  }

  const payload = {};

  if (title !== undefined) payload.title = normalizeOptionalText(title, 140) || banner.title;
  if (description !== undefined) payload.description = normalizeOptionalText(description, 280);
  if (ctaText !== undefined) payload.ctaText = normalizeOptionalText(ctaText, 80);
  if (ctaLink !== undefined) payload.ctaLink = normalizeOptionalText(ctaLink, 500);

  if (orden !== undefined && orden !== null && orden !== '') {
    payload.orden = normalizeOptionalNumber(orden, banner.orden);
  }

  if (typeof status === 'boolean') {
    payload.status = status;
  }

  if (file?.filename) {
    payload.imageUrl = file.filename;
  }

  const previousImage = banner.imageUrl;
  await banner.update(payload);

  if (file?.filename && previousImage && previousImage !== file.filename) {
    safeDeleteBannerImage(previousImage);
  }

  return toPublicBanner(banner);
}

async function updateBannerStatus({ bannerId, status }) {
  const parsedBannerId = Number.parseInt(String(bannerId), 10);

  if (!Number.isInteger(parsedBannerId) || parsedBannerId <= 0) {
    throw new HttpError(400, 'Id de banner invalido.');
  }

  if (typeof status !== 'boolean') {
    throw new HttpError(400, 'Status invalido. Usa true/false.');
  }

  const banner = await Banner.findByPk(parsedBannerId);

  if (!banner) {
    throw new HttpError(404, 'Banner no encontrado.');
  }

  await banner.update({ status });
  return toPublicBanner(banner);
}

async function deleteBanner({ bannerId }) {
  const parsedBannerId = Number.parseInt(String(bannerId), 10);

  if (!Number.isInteger(parsedBannerId) || parsedBannerId <= 0) {
    throw new HttpError(400, 'Id de banner invalido.');
  }

  const banner = await Banner.findByPk(parsedBannerId);

  if (!banner) {
    throw new HttpError(404, 'Banner no encontrado.');
  }

  const imageName = banner.imageUrl;
  await banner.destroy();
  safeDeleteBannerImage(imageName);

  return { message: 'Banner eliminado correctamente.' };
}

module.exports = {
  listBanners,
  listPublicBanners,
  getBannerById,
  createBanner,
  updateBanner,
  updateBannerStatus,
  deleteBanner,
};
