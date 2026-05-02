const productoImagenService = require('./productoImagen.service');
const HttpError = require('../../utils/httpError');

function assertSuperAdmin(req) {
  if (Number(req.admin?.rol) !== 1) {
    throw new HttpError(403, 'Solo el superadmin puede gestionar imagenes de productos.');
  }
}

async function uploadImagenes(req, res, next) {
  try {
    assertSuperAdmin(req);

    const imagenes = await productoImagenService.addImagenes({
      productoId: req.params.productoId,
      files: req.files,
    });

    return res.status(201).json({
      ok: true,
      message: `${imagenes.length} imagen(es) subida(s) correctamente.`,
      data: imagenes,
    });
  } catch (error) {
    return next(error);
  }
}

async function listImagenes(req, res, next) {
  try {
    const imagenes = await productoImagenService.listImagenesByProducto(req.params.productoId);

    return res.status(200).json({
      ok: true,
      data: imagenes,
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteImagen(req, res, next) {
  try {
    assertSuperAdmin(req);

    await productoImagenService.deleteImagen({
      imagenId: req.params.imagenId,
      productoId: req.params.productoId,
    });

    return res.status(200).json({
      ok: true,
      message: 'Imagen eliminada correctamente.',
    });
  } catch (error) {
    return next(error);
  }
}

async function reorderImagenes(req, res, next) {
  try {
    assertSuperAdmin(req);

    const imagenes = await productoImagenService.reorderImagenes({
      productoId: req.params.productoId,
      orden: req.body.orden,
    });

    return res.status(200).json({
      ok: true,
      message: 'Orden de imagenes actualizado correctamente.',
      data: imagenes,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  uploadImagenes,
  listImagenes,
  deleteImagen,
  reorderImagenes,
};
