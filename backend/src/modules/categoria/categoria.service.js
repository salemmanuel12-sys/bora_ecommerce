const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { Categoria } = require('../../models/loader');
const HttpError = require('../../utils/httpError');

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

function removeCategoriaImageFile(imageUrl) {
  if (!imageUrl) {
    return;
  }

  const safeFilename = path.basename(String(imageUrl));
  const filePath = path.join(__dirname, '..', '..', '..', 'uploadsImages', 'categorias', safeFilename);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (_error) {
    // Ignorar si no se puede eliminar el archivo del disco
  }
}

function toPublicCategoria(categoria) {
  const item = categoria?.get ? categoria.get({ plain: true }) : categoria;

  return {
    id: item.id,
    uuid: item.uuid,
    name: item.name,
    description: item.description,
    imageUrl: item.imageUrl,
    status: Boolean(item.status),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

async function listCategorias({ page = 1, limit = 10, search = '', includeInactive = false } = {}) {
  const parsedPage = Math.max(1, Number.parseInt(String(page), 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, Number.parseInt(String(limit), 10) || 10));
  const offset = (parsedPage - 1) * parsedLimit;

  const where = {};

  if (!parseBoolean(includeInactive, false)) {
    where.status = true;
  }

  if (search && String(search).trim()) {
    where.name = {
      [Op.like]: `%${String(search).trim().slice(0, 120)}%`,
    };
  }

  const { count, rows } = await Categoria.findAndCountAll({
    where,
    order: [['id', 'ASC']],
    limit: parsedLimit,
    offset,
  });

  return {
    categorias: rows.map(toPublicCategoria),
    pagination: {
      total: count,
      page: parsedPage,
      limit: parsedLimit,
      pages: Math.max(1, Math.ceil(count / parsedLimit)),
    },
  };
}

async function getCategoriaById(categoriaId) {
  const parsedCategoriaId = Number.parseInt(String(categoriaId), 10);

  if (!Number.isInteger(parsedCategoriaId) || parsedCategoriaId <= 0) {
    throw new HttpError(400, 'Id de categoria invalido.');
  }

  const categoria = await Categoria.findByPk(parsedCategoriaId);

  if (!categoria) {
    throw new HttpError(404, 'Categoria no encontrada.');
  }

  return toPublicCategoria(categoria);
}

async function createCategoria({ name, description, imageUrl, status = true }) {
  const cleanName = sanitizeText(name, 120);
  const cleanDescription = sanitizeText(description || '', 255) || null;
  const cleanImageUrl = sanitizeText(imageUrl || '', 500) || null;
  const cleanStatus = Boolean(status);

  if (!cleanName) {
    throw new HttpError(400, 'El nombre de la categoria es obligatorio.');
  }

  const duplicate = await Categoria.findOne({
    where: {
      name: cleanName,
    },
  });

  if (duplicate) {
    throw new HttpError(409, 'Ya existe una categoria con ese nombre.');
  }

  const categoria = await Categoria.create({
    name: cleanName,
    description: cleanDescription,
    imageUrl: cleanImageUrl,
    status: cleanStatus,
  });

  return toPublicCategoria(categoria);
}

async function updateCategoria({ categoriaId, name, description, imageUrl, status }) {
  const parsedCategoriaId = Number.parseInt(String(categoriaId), 10);

  if (!Number.isInteger(parsedCategoriaId) || parsedCategoriaId <= 0) {
    throw new HttpError(400, 'Id de categoria invalido.');
  }

  const categoria = await Categoria.findByPk(parsedCategoriaId);

  if (!categoria) {
    throw new HttpError(404, 'Categoria no encontrada.');
  }

  const cleanName = sanitizeText(name, 120);
  const cleanDescription = sanitizeText(description || '', 255) || null;
  const imageWasExplicitlyProvided = imageUrl !== undefined;
  const cleanImageUrl = imageWasExplicitlyProvided
    ? (sanitizeText(imageUrl || '', 500) || null)
    : categoria.imageUrl;

  if (!cleanName) {
    throw new HttpError(400, 'El nombre de la categoria es obligatorio.');
  }

  const duplicate = await Categoria.findOne({
    where: {
      name: cleanName,
      id: { [Op.ne]: parsedCategoriaId },
    },
  });

  if (duplicate) {
    throw new HttpError(409, 'Ya existe una categoria con ese nombre.');
  }

  const payload = {
    name: cleanName,
    description: cleanDescription,
    imageUrl: cleanImageUrl,
  };

  if (imageWasExplicitlyProvided && categoria.imageUrl && cleanImageUrl !== categoria.imageUrl) {
    removeCategoriaImageFile(categoria.imageUrl);
  }

  if (typeof status === 'boolean') {
    payload.status = status;
  }

  await categoria.update(payload);

  return toPublicCategoria(categoria);
}

async function updateCategoriaStatus({ categoriaId, status }) {
  const parsedCategoriaId = Number.parseInt(String(categoriaId), 10);

  if (!Number.isInteger(parsedCategoriaId) || parsedCategoriaId <= 0) {
    throw new HttpError(400, 'Id de categoria invalido.');
  }

  if (typeof status !== 'boolean') {
    throw new HttpError(400, 'Status invalido. Usa true/false.');
  }

  const categoria = await Categoria.findByPk(parsedCategoriaId);

  if (!categoria) {
    throw new HttpError(404, 'Categoria no encontrada.');
  }

  await categoria.update({ status });

  return toPublicCategoria(categoria);
}

async function deleteCategoria({ categoriaId }) {
  const parsedCategoriaId = Number.parseInt(String(categoriaId), 10);

  if (!Number.isInteger(parsedCategoriaId) || parsedCategoriaId <= 0) {
    throw new HttpError(400, 'Id de categoria invalido.');
  }

  const categoria = await Categoria.findByPk(parsedCategoriaId);

  if (!categoria) {
    throw new HttpError(404, 'Categoria no encontrada.');
  }

  const { Producto } = require('../../models/loader');
  const childCount = await Producto.count({ where: { categoriaId: parsedCategoriaId } });

  if (childCount > 0) {
    throw new HttpError(409, 'No se puede eliminar la categoría porque tiene productos asociados.');
  }

  if (categoria.imageUrl) {
    removeCategoriaImageFile(categoria.imageUrl);
  }

  await categoria.destroy();
}

module.exports = {
  listCategorias,
  getCategoriaById,
  createCategoria,
  updateCategoria,
  updateCategoriaStatus,
  deleteCategoria,
};
