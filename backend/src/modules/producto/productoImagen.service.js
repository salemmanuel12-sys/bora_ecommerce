const path = require('path');
const fs = require('fs');
const { ProductoImagen, Producto } = require('../../models/loader');
const HttpError = require('../../utils/httpError');

const UPLOAD_DIR = path.join(__dirname, '..', '..', '..', 'uploadsImages', 'productos');

function toPublicImagen(imagen) {
  const item = imagen?.get ? imagen.get({ plain: true }) : imagen;

  return {
    id: item.id,
    uuid: item.uuid,
    productoId: item.productoId,
    url: item.url,
    orden: item.orden,
    status: Boolean(item.status),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

async function assertProductoExists(productoId) {
  const producto = await Producto.findByPk(productoId);

  if (!producto) {
    throw new HttpError(404, 'Producto no encontrado.');
  }
}

async function addImagenes({ productoId, files }) {
  const parsedProductoId = Number.parseInt(String(productoId), 10);

  if (!Number.isInteger(parsedProductoId) || parsedProductoId <= 0) {
    throw new HttpError(400, 'Id de producto invalido.');
  }

  await assertProductoExists(parsedProductoId);

  if (!files || files.length === 0) {
    throw new HttpError(400, 'No se recibieron imagenes.');
  }

  const currentMax = await ProductoImagen.max('orden', {
    where: { productoId: parsedProductoId },
  });

  const baseOrden = Number.isFinite(currentMax) ? currentMax : 0;

  const imagenes = await Promise.all(
    files.map((file, index) =>
      ProductoImagen.create({
        productoId: parsedProductoId,
        url: `productos/${file.filename}`,
        orden: baseOrden + index + 1,
        status: true,
      })
    )
  );

  return imagenes.map(toPublicImagen);
}

async function listImagenesByProducto(productoId) {
  const parsedProductoId = Number.parseInt(String(productoId), 10);

  if (!Number.isInteger(parsedProductoId) || parsedProductoId <= 0) {
    throw new HttpError(400, 'Id de producto invalido.');
  }

  const imagenes = await ProductoImagen.findAll({
    where: { productoId: parsedProductoId },
    order: [
      ['orden', 'ASC'],
      ['id', 'ASC'],
    ],
  });

  return imagenes.map(toPublicImagen);
}

async function deleteImagen({ imagenId, productoId }) {
  const parsedImagenId = Number.parseInt(String(imagenId), 10);
  const parsedProductoId = Number.parseInt(String(productoId), 10);

  if (!Number.isInteger(parsedImagenId) || parsedImagenId <= 0) {
    throw new HttpError(400, 'Id de imagen invalido.');
  }

  if (!Number.isInteger(parsedProductoId) || parsedProductoId <= 0) {
    throw new HttpError(400, 'Id de producto invalido.');
  }

  const imagen = await ProductoImagen.findOne({
    where: { id: parsedImagenId, productoId: parsedProductoId },
  });

  if (!imagen) {
    throw new HttpError(404, 'Imagen no encontrada.');
  }

  // Eliminar archivo del disco de forma segura: solo el basename para evitar path traversal
  const safeFilename = path.basename(imagen.url);
  const filePath = path.join(UPLOAD_DIR, safeFilename);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (_err) {
    // Si falla la eliminacion del disco, aun eliminamos el registro de BD
  }

  await imagen.destroy();
}

async function reorderImagenes({ productoId, orden }) {
  const parsedProductoId = Number.parseInt(String(productoId), 10);

  if (!Number.isInteger(parsedProductoId) || parsedProductoId <= 0) {
    throw new HttpError(400, 'Id de producto invalido.');
  }

  if (!Array.isArray(orden) || orden.length === 0) {
    throw new HttpError(400, 'El campo orden debe ser un arreglo de { id, orden }.');
  }

  for (const item of orden) {
    const parsedId = Number.parseInt(String(item?.id ?? ''), 10);
    const parsedOrden = Number.parseInt(String(item?.orden ?? ''), 10);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      throw new HttpError(400, 'Cada elemento de orden debe tener un id valido.');
    }

    if (!Number.isInteger(parsedOrden) || parsedOrden < 0) {
      throw new HttpError(400, 'Cada elemento de orden debe tener un valor de orden valido (entero >= 0).');
    }
  }

  await Promise.all(
    orden.map(({ id, orden: o }) =>
      ProductoImagen.update(
        { orden: Number.parseInt(String(o), 10) },
        { where: { id: Number.parseInt(String(id), 10), productoId: parsedProductoId } }
      )
    )
  );

  return listImagenesByProducto(parsedProductoId);
}

module.exports = {
  addImagenes,
  listImagenesByProducto,
  deleteImagen,
  reorderImagenes,
};
