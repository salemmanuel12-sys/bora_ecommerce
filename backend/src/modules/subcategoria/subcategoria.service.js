const { Op } = require('sequelize');
const { Categoria, Subcategoria } = require('../../models/loader');
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

function toPublicSubcategoria(subcategoria) {
  const item = subcategoria?.get ? subcategoria.get({ plain: true }) : subcategoria;

  return {
    id: item.id,
    uuid: item.uuid,
    categoriaId: item.categoriaId,
    name: item.name,
    description: item.description,
    status: Boolean(item.status),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    categoria: item.categoria
      ? {
          id: item.categoria.id,
          uuid: item.categoria.uuid,
          name: item.categoria.name,
          status: Boolean(item.categoria.status),
        }
      : undefined,
  };
}

async function assertCategoriaExists(categoriaId) {
  const categoria = await Categoria.findByPk(categoriaId);

  if (!categoria) {
    throw new HttpError(404, 'Categoria padre no encontrada.');
  }
}

async function listSubcategorias({ page = 1, limit = 10, search = '', includeInactive = false, categoriaId } = {}) {
  const parsedPage = Math.max(1, Number.parseInt(String(page), 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, Number.parseInt(String(limit), 10) || 10));
  const offset = (parsedPage - 1) * parsedLimit;

  const where = {};

  if (!parseBoolean(includeInactive, false)) {
    where.status = true;
  }

  if (categoriaId !== undefined && categoriaId !== null && categoriaId !== '') {
    const parsedCategoriaId = Number.parseInt(String(categoriaId), 10);

    if (!Number.isInteger(parsedCategoriaId) || parsedCategoriaId <= 0) {
      throw new HttpError(400, 'categoriaId invalido.');
    }

    where.categoriaId = parsedCategoriaId;
  }

  if (search && String(search).trim()) {
    where.name = {
      [Op.like]: `%${String(search).trim().slice(0, 120)}%`,
    };
  }

  const { count, rows } = await Subcategoria.findAndCountAll({
    where,
    include: [
      {
        model: Categoria,
        as: 'categoria',
        attributes: ['id', 'uuid', 'name', 'status'],
      },
    ],
    order: [['id', 'ASC']],
    limit: parsedLimit,
    offset,
  });

  return {
    subcategorias: rows.map(toPublicSubcategoria),
    pagination: {
      total: count,
      page: parsedPage,
      limit: parsedLimit,
      pages: Math.max(1, Math.ceil(count / parsedLimit)),
    },
  };
}

async function getSubcategoriaById(subcategoriaId) {
  const parsedSubcategoriaId = Number.parseInt(String(subcategoriaId), 10);

  if (!Number.isInteger(parsedSubcategoriaId) || parsedSubcategoriaId <= 0) {
    throw new HttpError(400, 'Id de subcategoria invalido.');
  }

  const subcategoria = await Subcategoria.findByPk(parsedSubcategoriaId, {
    include: [
      {
        model: Categoria,
        as: 'categoria',
        attributes: ['id', 'uuid', 'name', 'status'],
      },
    ],
  });

  if (!subcategoria) {
    throw new HttpError(404, 'Subcategoria no encontrada.');
  }

  return toPublicSubcategoria(subcategoria);
}

async function createSubcategoria({ categoriaId, name, description, status = true }) {
  const parsedCategoriaId = Number.parseInt(String(categoriaId), 10);

  if (!Number.isInteger(parsedCategoriaId) || parsedCategoriaId <= 0) {
    throw new HttpError(400, 'categoriaId invalido.');
  }

  await assertCategoriaExists(parsedCategoriaId);

  const cleanName = sanitizeText(name, 120);
  const cleanDescription = sanitizeText(description || '', 255) || null;
  const cleanStatus = Boolean(status);

  if (!cleanName) {
    throw new HttpError(400, 'El nombre de la subcategoria es obligatorio.');
  }

  const duplicate = await Subcategoria.findOne({
    where: {
      categoriaId: parsedCategoriaId,
      name: cleanName,
    },
  });

  if (duplicate) {
    throw new HttpError(409, 'Ya existe una subcategoria con ese nombre en la categoria.');
  }

  const subcategoria = await Subcategoria.create({
    categoriaId: parsedCategoriaId,
    name: cleanName,
    description: cleanDescription,
    status: cleanStatus,
  });

  return getSubcategoriaById(subcategoria.id);
}

async function updateSubcategoria({ subcategoriaId, categoriaId, name, description, status }) {
  const parsedSubcategoriaId = Number.parseInt(String(subcategoriaId), 10);

  if (!Number.isInteger(parsedSubcategoriaId) || parsedSubcategoriaId <= 0) {
    throw new HttpError(400, 'Id de subcategoria invalido.');
  }

  const subcategoria = await Subcategoria.findByPk(parsedSubcategoriaId);

  if (!subcategoria) {
    throw new HttpError(404, 'Subcategoria no encontrada.');
  }

  const cleanName = sanitizeText(name, 120);
  const cleanDescription = sanitizeText(description || '', 255) || null;

  if (!cleanName) {
    throw new HttpError(400, 'El nombre de la subcategoria es obligatorio.');
  }

  const targetCategoriaId = categoriaId === undefined || categoriaId === null
    ? subcategoria.categoriaId
    : Number.parseInt(String(categoriaId), 10);

  if (!Number.isInteger(targetCategoriaId) || targetCategoriaId <= 0) {
    throw new HttpError(400, 'categoriaId invalido.');
  }

  await assertCategoriaExists(targetCategoriaId);

  const duplicate = await Subcategoria.findOne({
    where: {
      categoriaId: targetCategoriaId,
      name: cleanName,
      id: { [Op.ne]: parsedSubcategoriaId },
    },
  });

  if (duplicate) {
    throw new HttpError(409, 'Ya existe una subcategoria con ese nombre en la categoria.');
  }

  const payload = {
    categoriaId: targetCategoriaId,
    name: cleanName,
    description: cleanDescription,
  };

  if (typeof status === 'boolean') {
    payload.status = status;
  }

  await subcategoria.update(payload);

  return getSubcategoriaById(subcategoria.id);
}

async function updateSubcategoriaStatus({ subcategoriaId, status }) {
  const parsedSubcategoriaId = Number.parseInt(String(subcategoriaId), 10);

  if (!Number.isInteger(parsedSubcategoriaId) || parsedSubcategoriaId <= 0) {
    throw new HttpError(400, 'Id de subcategoria invalido.');
  }

  if (typeof status !== 'boolean') {
    throw new HttpError(400, 'Status invalido. Usa true/false.');
  }

  const subcategoria = await Subcategoria.findByPk(parsedSubcategoriaId);

  if (!subcategoria) {
    throw new HttpError(404, 'Subcategoria no encontrada.');
  }

  await subcategoria.update({ status });

  return getSubcategoriaById(subcategoria.id);
}

module.exports = {
  listSubcategorias,
  getSubcategoriaById,
  createSubcategoria,
  updateSubcategoria,
  updateSubcategoriaStatus,
};
