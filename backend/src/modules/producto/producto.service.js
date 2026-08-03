const { Op } = require('sequelize');
const {
  sequelize,
  Producto,
  Categoria,
  Atributo,
  AtributoValor,
  ProductoAtributo,
  ProductoImagen,
  ProductoDescuento,
} = require('../../models/loader');
const HttpError = require('../../utils/httpError');
const {
  mapDescuentoPublic,
  normalizeDescuentosMayoreoInput,
} = require('../../utils/productoDescuento.utils');

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

function normalizeAttributeText(value, maxLength) {
  return sanitizeText(value || '', maxLength);
}

function normalizeNullableDimension(value, fieldLabel) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  const parsed = Number.parseFloat(String(value));

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new HttpError(400, `${fieldLabel} invalido. Debe ser un numero positivo o cero.`);
  }

  return Math.round(parsed * 100) / 100;
}

function normalizeAtributos(atributos) {
  if (atributos === undefined || atributos === null || atributos === '') {
    return [];
  }

  if (!Array.isArray(atributos)) {
    throw new HttpError(400, 'atributos invalido.');
  }

  const normalized = [];
  const seen = new Set();

  for (const item of atributos) {
    const nombre = normalizeAttributeText(item?.nombre ?? item?.name ?? '', 80);
    const valor = normalizeAttributeText(item?.valor ?? item?.value ?? '', 120);

    if (!nombre && !valor) {
      continue;
    }

    if (!nombre || !valor) {
      throw new HttpError(400, 'Cada atributo debe incluir nombre y valor.');
    }

    const key = `${nombre.toLowerCase()}::${valor.toLowerCase()}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push({ nombre, valor });
  }

  return normalized;
}

async function findOrCreateAtributo(nombre, transaction) {
  let atributo = await Atributo.findOne({
    where: sequelize.where(sequelize.fn('LOWER', sequelize.col('nombre')), nombre.toLowerCase()),
    transaction,
  });

  if (!atributo) {
    atributo = await Atributo.create({ nombre }, { transaction });
    return atributo;
  }

  if (atributo.nombre !== nombre) {
    await atributo.update({ nombre }, { transaction });
  }

  return atributo;
}

async function findOrCreateAtributoValor(atributoId, valor, transaction) {
  let atributoValor = await AtributoValor.findOne({
    where: {
      atributoId,
      [Op.and]: sequelize.where(sequelize.fn('LOWER', sequelize.col('valor')), valor.toLowerCase()),
    },
    transaction,
  });

  if (!atributoValor) {
    atributoValor = await AtributoValor.create({ atributoId, valor }, { transaction });
    return atributoValor;
  }

  if (atributoValor.valor !== valor) {
    await atributoValor.update({ valor }, { transaction });
  }

  return atributoValor;
}

async function syncProductoAtributos(productoId, atributos, transaction) {
  await ProductoAtributo.destroy({ where: { productoId }, transaction });

  if (!atributos.length) {
    return;
  }

  for (const atributoItem of atributos) {
    const atributo = await findOrCreateAtributo(atributoItem.nombre, transaction);
    const atributoValor = await findOrCreateAtributoValor(atributo.id, atributoItem.valor, transaction);

    await ProductoAtributo.create(
      {
        productoId,
        atributoId: atributo.id,
        valorId: atributoValor.id,
      },
      { transaction }
    );
  }
}

async function syncProductoDescuentos(productoId, descuentosMayoreo, transaction) {
  await ProductoDescuento.destroy({ where: { productoId }, transaction });

  if (!descuentosMayoreo.length) {
    return;
  }

  await ProductoDescuento.bulkCreate(
    descuentosMayoreo.map((row) => ({
      productoId,
      cantidadMin: row.cantidadMin,
      cantidadMax: row.cantidadMax,
      tipoDescuento: row.tipoDescuento,
      valor: row.valor,
    })),
    { transaction }
  );
}

function toPublicProducto(producto) {
  const item = producto?.get ? producto.get({ plain: true }) : producto;
  const atributos = Array.isArray(item.atributosAsignaciones)
    ? item.atributosAsignaciones
        .map((assignment) => ({
          id: assignment.id,
          atributoId: assignment.atributoId,
          valorId: assignment.valorId,
          atributo: assignment.atributo
            ? {
                id: assignment.atributo.id,
                nombre: assignment.atributo.nombre,
              }
            : null,
          valor: assignment.valor
            ? {
                id: assignment.valor.id,
                valor: assignment.valor.valor,
              }
            : null,
        }))
        .sort((left, right) => {
          const compareName = (left.atributo?.nombre || '').localeCompare(right.atributo?.nombre || '');

          if (compareName !== 0) {
            return compareName;
          }

          return (left.valor?.valor || '').localeCompare(right.valor?.valor || '');
        })
    : [];

  return {
    id: item.id,
    uuid: item.uuid,
    categoriaId: item.categoriaId,
    name: item.name,
    description: item.description,
    price: Number(item.price),
    averageRating: Number(item.averageRating || 0),
    totalRatings: Number(item.totalRatings || 0),
    stock: item.stock,
    peso: item.peso !== null && item.peso !== undefined ? Number(item.peso) : null,
    alto: item.alto !== null && item.alto !== undefined ? Number(item.alto) : null,
    ancho: item.ancho !== null && item.ancho !== undefined ? Number(item.ancho) : null,
    largo: item.largo !== null && item.largo !== undefined ? Number(item.largo) : null,
    sku: item.sku,
    status: Boolean(item.status),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    atributos,
    descuentosMayoreo: Array.isArray(item.descuentosMayoreo)
      ? item.descuentosMayoreo
          .map((row) => mapDescuentoPublic(row))
          .sort((left, right) => {
            if (left.cantidadMin !== right.cantidadMin) {
              return left.cantidadMin - right.cantidadMin;
            }

            return left.cantidadMax - right.cantidadMax;
          })
      : [],
    imagenes: Array.isArray(item.imagenes)
      ? item.imagenes.map((img) => ({
          id: img.id,
          uuid: img.uuid,
          url: img.url,
          orden: img.orden,
          status: Boolean(img.status),
        }))
      : [],
    categoria: item.categoria
      ? {
          id: item.categoria.id,
          uuid: item.categoria.uuid,
          name: item.categoria.name,
          imageUrl: item.categoria.imageUrl,
          status: Boolean(item.categoria.status),
        }
      : undefined,
  };
}

function buildIncludeCategoria(categoria = '') {
  const cleanCategoria = String(categoria || '').trim();
  const categoriaInclude = {
    model: Categoria,
    as: 'categoria',
    attributes: ['id', 'uuid', 'name', 'imageUrl', 'status'],
  };

  if (cleanCategoria) {
    categoriaInclude.where = { name: cleanCategoria };
    categoriaInclude.required = true;
  }

  return categoriaInclude;
}

const includeImagenes = {
  model: ProductoImagen,
  as: 'imagenes',
  attributes: ['id', 'uuid', 'url', 'orden', 'status'],
  required: false,
  order: [['orden', 'ASC'], ['id', 'ASC']],
};

const includeAtributos = {
  model: ProductoAtributo,
  as: 'atributosAsignaciones',
  attributes: ['id', 'productoId', 'atributoId', 'valorId'],
  required: false,
  include: [
    {
      model: Atributo,
      as: 'atributo',
      attributes: ['id', 'nombre'],
    },
    {
      model: AtributoValor,
      as: 'valor',
      attributes: ['id', 'valor', 'atributoId'],
    },
  ],
};

const includeDescuentosMayoreo = {
  model: ProductoDescuento,
  as: 'descuentosMayoreo',
  attributes: ['id', 'productoId', 'cantidadMin', 'cantidadMax', 'tipoDescuento', 'valor', 'createdAt', 'updatedAt'],
  required: false,
};

async function assertCategoriaExists(categoriaId) {
  const categoria = await Categoria.findByPk(categoriaId);

  if (!categoria) {
    throw new HttpError(404, 'Categoria padre no encontrada.');
  }
}

async function listProductos({
  page = 1,
  limit = 10,
  search = '',
  includeInactive = false,
  categoriaId,
  categoria = '',
} = {}) {
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
    const cleanSearch = String(search).trim().slice(0, 150);

    where[Op.or] = [
      { name: { [Op.like]: `%${cleanSearch}%` } },
      { sku: { [Op.like]: `%${cleanSearch}%` } },
    ];
  }

  const { count, rows } = await Producto.findAndCountAll({
    where,
    include: [buildIncludeCategoria(categoria), includeImagenes, includeAtributos, includeDescuentosMayoreo],
    order: [['id', 'ASC']],
    distinct: true,
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
    include: [buildIncludeCategoria(''), includeImagenes, includeAtributos, includeDescuentosMayoreo],
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

async function createProducto({
  categoriaId,
  name,
  description,
  price,
  stock = 0,
  peso = null,
  alto = null,
  ancho = null,
  largo = null,
  sku,
  status = true,
  atributos = [],
  descuentosMayoreo = [],
}) {
  const parsedCategoriaId = Number.parseInt(String(categoriaId), 10);

  await assertCategoriaExists(parsedCategoriaId);

  const cleanName = sanitizeText(name, 150);
  const cleanDescription = sanitizeText(description || '', 2000) || null;
  const cleanSku = sanitizeText(sku, 100);
  const normalizedPeso = normalizeNullableDimension(peso, 'Peso');
  const normalizedAlto = normalizeNullableDimension(alto, 'Alto');
  const normalizedAncho = normalizeNullableDimension(ancho, 'Ancho');
  const normalizedLargo = normalizeNullableDimension(largo, 'Largo');

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

  const normalizedAtributos = normalizeAtributos(atributos);
  const normalizedDescuentosMayoreo = normalizeDescuentosMayoreoInput(descuentosMayoreo);

  if (normalizedDescuentosMayoreo === null) {
    throw new HttpError(400, 'descuentosMayoreo invalido. Usa rangos sin traslape con cantidadMin, cantidadMax, tipoDescuento y valor.');
  }

  const producto = await sequelize.transaction(async (transaction) => {
    const createdProducto = await Producto.create(
      {
        categoriaId: parsedCategoriaId,
        name: cleanName,
        description: cleanDescription,
        price: Number(price),
        stock: Number(stock),
        peso: normalizedPeso,
        alto: normalizedAlto,
        ancho: normalizedAncho,
        largo: normalizedLargo,
        sku: cleanSku,
        status: Boolean(status),
      },
      { transaction }
    );

    await syncProductoAtributos(createdProducto.id, normalizedAtributos, transaction);
    await syncProductoDescuentos(createdProducto.id, normalizedDescuentosMayoreo, transaction);

    return createdProducto;
  });

  return getProductoById(producto.id);
}

async function updateProducto({
  productoId,
  categoriaId,
  name,
  description,
  price,
  stock,
  peso,
  alto,
  ancho,
  largo,
  sku,
  status,
  atributos = [],
  descuentosMayoreo,
}) {
  const parsedProductoId = Number.parseInt(String(productoId), 10);

  if (!Number.isInteger(parsedProductoId) || parsedProductoId <= 0) {
    throw new HttpError(400, 'Id de producto invalido.');
  }

  const producto = await Producto.findByPk(parsedProductoId);

  if (!producto) {
    throw new HttpError(404, 'Producto no encontrado.');
  }

  const targetCategoriaId = categoriaId === undefined || categoriaId === null
    ? producto.categoriaId
    : Number.parseInt(String(categoriaId), 10);

  if (!Number.isInteger(targetCategoriaId) || targetCategoriaId <= 0) {
    throw new HttpError(400, 'categoriaId invalido.');
  }

  await assertCategoriaExists(targetCategoriaId);

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

  const normalizedAtributos = normalizeAtributos(atributos);
  const normalizedDescuentosMayoreo = descuentosMayoreo === undefined
    ? undefined
    : normalizeDescuentosMayoreoInput(descuentosMayoreo);

  if (normalizedDescuentosMayoreo === null) {
    throw new HttpError(400, 'descuentosMayoreo invalido. Usa rangos sin traslape con cantidadMin, cantidadMax, tipoDescuento y valor.');
  }

  const payload = {
    categoriaId: targetCategoriaId,
    name: cleanName,
    description: cleanDescription,
    price: Number(price),
    sku: cleanSku,
  };

  if (stock !== undefined && stock !== null) {
    payload.stock = Number(stock);
  }

  if (peso !== undefined) {
    payload.peso = normalizeNullableDimension(peso, 'Peso');
  }

  if (alto !== undefined) {
    payload.alto = normalizeNullableDimension(alto, 'Alto');
  }

  if (ancho !== undefined) {
    payload.ancho = normalizeNullableDimension(ancho, 'Ancho');
  }

  if (largo !== undefined) {
    payload.largo = normalizeNullableDimension(largo, 'Largo');
  }

  if (typeof status === 'boolean') {
    payload.status = status;
  }

  await sequelize.transaction(async (transaction) => {
    await producto.update(payload, { transaction });
    await syncProductoAtributos(producto.id, normalizedAtributos, transaction);

    if (normalizedDescuentosMayoreo !== undefined) {
      await syncProductoDescuentos(producto.id, normalizedDescuentosMayoreo, transaction);
    }
  });

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

async function deleteProducto({ productoId }) {
  const parsedProductoId = Number.parseInt(String(productoId), 10);

  if (!Number.isInteger(parsedProductoId) || parsedProductoId <= 0) {
    throw new HttpError(400, 'Id de producto invalido.');
  }

  const producto = await Producto.findByPk(parsedProductoId);

  if (!producto) {
    throw new HttpError(404, 'Producto no encontrado.');
  }

  const { OrderItem, CartItem, ProductoOpinion: Opinion } = require('../../models/loader');

  await OrderItem.destroy({ where: { productId: parsedProductoId } });
  await CartItem.destroy({ where: { productId: parsedProductoId } });
  await Opinion.destroy({ where: { productoId: parsedProductoId } });
  await ProductoDescuento.destroy({ where: { productoId: parsedProductoId } });
  await ProductoImagen.destroy({ where: { productoId: parsedProductoId } });
  await ProductoAtributo.destroy({ where: { productoId: parsedProductoId } });
  await producto.destroy();
}

module.exports = {
  listProductos,
  getProductoById,
  getPublicProductoById,
  createProducto,
  updateProducto,
  updateProductoStatus,
  deleteProducto,
};
