const { Op } = require('sequelize');
const { Producto, Subcategoria, Categoria, ProductoImagen } = require('../../models/loader');
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

function toPublicProducto(producto) {
  const item = producto?.get ? producto.get({ plain: true }) : producto;

  return {
    id: item.id,
    uuid: item.uuid,
    subcategoriaId: item.subcategoriaId,
    name: item.name,
    description: item.description,
    price: Number(item.price),
    averageRating: Number(item.averageRating || 0),
    totalRatings: Number(item.totalRatings || 0),
    stock: item.stock,
    sku: item.sku,
    status: Boolean(item.status),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    imagenes: Array.isArray(item.imagenes)
      ? item.imagenes.map((img) => ({
          id: img.id,
          uuid: img.uuid,
          url: img.url,
          orden: img.orden,
          status: Boolean(img.status),
        }))
      : [],
    subcategoria: item.subcategoria
      ? {
          id: item.subcategoria.id,
          uuid: item.subcategoria.uuid,
          name: item.subcategoria.name,
          status: Boolean(item.subcategoria.status),
          categoria: item.subcategoria.categoria
            ? {
                id: item.subcategoria.categoria.id,
                uuid: item.subcategoria.categoria.uuid,
                name: item.subcategoria.categoria.name,
                status: Boolean(item.subcategoria.categoria.status),
              }
            : undefined,
        }
      : undefined,
  };
}

function buildIncludeSubcategoria(categoria = '') {
  const cleanCategoria = String(categoria || '').trim();
  const categoriaInclude = {
    model: Categoria,
    as: 'categoria',
    attributes: ['id', 'uuid', 'name', 'status'],
  };

  if (cleanCategoria) {
    categoriaInclude.where = { name: cleanCategoria };
    categoriaInclude.required = true;
  }

  return {
    model: Subcategoria,
    as: 'subcategoria',
    attributes: ['id', 'uuid', 'name', 'status'],
    required: Boolean(cleanCategoria),
    include: [categoriaInclude],
  };
}

const includeImagenes = {
  model: ProductoImagen,
  as: 'imagenes',
  attributes: ['id', 'uuid', 'url', 'orden', 'status'],
  required: false,
  order: [['orden', 'ASC'], ['id', 'ASC']],
};

async function assertSubcategoriaExists(subcategoriaId) {
  const subcategoria = await Subcategoria.findByPk(subcategoriaId);

  if (!subcategoria) {
    throw new HttpError(404, 'Subcategoria padre no encontrada.');
  }
}

async function listProductos({
  page = 1,
  limit = 10,
  search = '',
  includeInactive = false,
  subcategoriaId,
  categoria = '',
} = {}) {
  const parsedPage = Math.max(1, Number.parseInt(String(page), 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, Number.parseInt(String(limit), 10) || 10));
  const offset = (parsedPage - 1) * parsedLimit;

  const where = {};

  if (!parseBoolean(includeInactive, false)) {
    where.status = true;
  }

  if (subcategoriaId !== undefined && subcategoriaId !== null && subcategoriaId !== '') {
    const parsedSubcategoriaId = Number.parseInt(String(subcategoriaId), 10);

    if (!Number.isInteger(parsedSubcategoriaId) || parsedSubcategoriaId <= 0) {
      throw new HttpError(400, 'subcategoriaId invalido.');
    }

    where.subcategoriaId = parsedSubcategoriaId;
  }

  if (search && String(search).trim()) {
    const cleanSearch = String(search).trim().slice(0, 150);

    where[Op.or] = [
      { name: { [Op.like]: `%${cleanSearch}%` } },
      { sku: { [Op.like]: `%${cleanSearch}%` } },
    ];
  }

  const { count, rows } = await Producto.findAndCountAll({
    where,
    include: [buildIncludeSubcategoria(categoria), includeImagenes],
    order: [['id', 'ASC']],
    limit: parsedLimit,
    offset,
  });

  return {
    productos: rows.map(toPublicProducto),
    pagination: {
      total: count,
      page: parsedPage,
      limit: parsedLimit,
      pages: Math.max(1, Math.ceil(count / parsedLimit)),
    },
  };
}

async function getProductoById(productoId) {
  const parsedProductoId = Number.parseInt(String(productoId), 10);

  if (!Number.isInteger(parsedProductoId) || parsedProductoId <= 0) {
    throw new HttpError(400, 'Id de producto invalido.');
  }

  const producto = await Producto.findByPk(parsedProductoId, {
    include: [buildIncludeSubcategoria(''), includeImagenes],
  });

  if (!producto) {
    throw new HttpError(404, 'Producto no encontrado.');
  }

  return toPublicProducto(producto);
}

async function getPublicProductoById(productoId) {
  const producto = await getProductoById(productoId);

  if (!producto.status) {
    throw new HttpError(404, 'Producto no encontrado.');
  }

  return producto;
}

async function createProducto({ subcategoriaId, name, description, price, stock = 0, sku, status = true }) {
  const parsedSubcategoriaId = Number.parseInt(String(subcategoriaId), 10);

  await assertSubcategoriaExists(parsedSubcategoriaId);

  const cleanName = sanitizeText(name, 150);
  const cleanDescription = sanitizeText(description || '', 2000) || null;
  const cleanSku = sanitizeText(sku, 100);

  if (!cleanName) {
    throw new HttpError(400, 'El nombre del producto es obligatorio.');
  }

  if (!cleanSku) {
    throw new HttpError(400, 'El SKU es obligatorio.');
  }

  const duplicateSku = await Producto.findOne({ where: { sku: cleanSku } });

  if (duplicateSku) {
    throw new HttpError(409, 'Ya existe un producto con ese SKU.');
  }

  const producto = await Producto.create({
    subcategoriaId: parsedSubcategoriaId,
    name: cleanName,
    description: cleanDescription,
    price: Number(price),
    stock: Number(stock),
    sku: cleanSku,
    status: Boolean(status),
  });

  return getProductoById(producto.id);
}

async function updateProducto({ productoId, subcategoriaId, name, description, price, stock, sku, status }) {
  const parsedProductoId = Number.parseInt(String(productoId), 10);

  if (!Number.isInteger(parsedProductoId) || parsedProductoId <= 0) {
    throw new HttpError(400, 'Id de producto invalido.');
  }

  const producto = await Producto.findByPk(parsedProductoId);

  if (!producto) {
    throw new HttpError(404, 'Producto no encontrado.');
  }

  const targetSubcategoriaId = subcategoriaId === undefined || subcategoriaId === null
    ? producto.subcategoriaId
    : Number.parseInt(String(subcategoriaId), 10);

  if (!Number.isInteger(targetSubcategoriaId) || targetSubcategoriaId <= 0) {
    throw new HttpError(400, 'subcategoriaId invalido.');
  }

  await assertSubcategoriaExists(targetSubcategoriaId);

  const cleanName = sanitizeText(name, 150);
  const cleanDescription = sanitizeText(description || '', 2000) || null;
  const cleanSku = sanitizeText(sku, 100);

  if (!cleanName) {
    throw new HttpError(400, 'El nombre del producto es obligatorio.');
  }

  if (!cleanSku) {
    throw new HttpError(400, 'El SKU es obligatorio.');
  }

  const duplicateSku = await Producto.findOne({
    where: {
      sku: cleanSku,
      id: { [Op.ne]: parsedProductoId },
    },
  });

  if (duplicateSku) {
    throw new HttpError(409, 'Ya existe un producto con ese SKU.');
  }

  const payload = {
    subcategoriaId: targetSubcategoriaId,
    name: cleanName,
    description: cleanDescription,
    price: Number(price),
    sku: cleanSku,
  };

  if (stock !== undefined && stock !== null) {
    payload.stock = Number(stock);
  }

  if (typeof status === 'boolean') {
    payload.status = status;
  }

  await producto.update(payload);

  return getProductoById(producto.id);
}

async function updateProductoStatus({ productoId, status }) {
  const parsedProductoId = Number.parseInt(String(productoId), 10);

  if (!Number.isInteger(parsedProductoId) || parsedProductoId <= 0) {
    throw new HttpError(400, 'Id de producto invalido.');
  }

  if (typeof status !== 'boolean') {
    throw new HttpError(400, 'Status invalido. Usa true/false.');
  }

  const producto = await Producto.findByPk(parsedProductoId);

  if (!producto) {
    throw new HttpError(404, 'Producto no encontrado.');
  }

  await producto.update({ status });

  return getProductoById(producto.id);
}

module.exports = {
  listProductos,
  getProductoById,
  getPublicProductoById,
  createProducto,
  updateProducto,
  updateProductoStatus,
};
