const productoService = require('./producto.service');
const HttpError = require('../../utils/httpError');

function assertSuperAdmin(req) {
  if (Number(req.admin?.rol) !== 1) {
    throw new HttpError(403, 'Solo el superadmin puede gestionar productos.');
  }
}

async function listProductos(req, res, next) {
  try {
    const result = await productoService.listProductos({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      includeInactive: req.query.include_inactive,
      subcategoriaId: req.query.subcategoriaId,
      categoria: req.query.categoria,
    });

    return res.status(200).json({
      ok: true,
      data: result.productos,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
}

async function listPublicProductos(req, res, next) {
  try {
    const result = await productoService.listProductos({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      includeInactive: false,
      subcategoriaId: req.query.subcategoriaId,
      categoria: req.query.categoria,
    });

    return res.status(200).json({
      ok: true,
      data: result.productos,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
}

async function getProducto(req, res, next) {
  try {
    const producto = await productoService.getProductoById(req.params.productoId);

    return res.status(200).json({
      ok: true,
      data: producto,
    });
  } catch (error) {
    return next(error);
  }
}

async function getPublicProducto(req, res, next) {
  try {
    const producto = await productoService.getPublicProductoById(req.params.productoId);

    return res.status(200).json({
      ok: true,
      data: producto,
    });
  } catch (error) {
    return next(error);
  }
}

async function createProducto(req, res, next) {
  try {
    assertSuperAdmin(req);

    const producto = await productoService.createProducto({
      subcategoriaId: req.body.subcategoriaId,
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      stock: req.body.stock,
      sku: req.body.sku,
      status: req.body.status,
    });

    return res.status(201).json({
      ok: true,
      message: 'Producto creado correctamente.',
      data: producto,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateProducto(req, res, next) {
  try {
    assertSuperAdmin(req);

    const producto = await productoService.updateProducto({
      productoId: req.params.productoId,
      subcategoriaId: req.body.subcategoriaId,
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      stock: req.body.stock,
      sku: req.body.sku,
      status: req.body.status,
    });

    return res.status(200).json({
      ok: true,
      message: 'Producto actualizado correctamente.',
      data: producto,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateProductoStatus(req, res, next) {
  try {
    assertSuperAdmin(req);

    const producto = await productoService.updateProductoStatus({
      productoId: req.params.productoId,
      status: req.body.status,
    });

    return res.status(200).json({
      ok: true,
      message: 'Status de producto actualizado correctamente.',
      data: producto,
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteProducto(req, res, next) {
  try {
    assertSuperAdmin(req);

    const producto = await productoService.updateProductoStatus({
      productoId: req.params.productoId,
      status: false,
    });

    return res.status(200).json({
      ok: true,
      message: 'Producto desactivado correctamente.',
      data: producto,
    });
  } catch (error) {
    return next(error);
  }
}

async function reactivateProducto(req, res, next) {
  try {
    assertSuperAdmin(req);

    const producto = await productoService.updateProductoStatus({
      productoId: req.params.productoId,
      status: true,
    });

    return res.status(200).json({
      ok: true,
      message: 'Producto reactivado correctamente.',
      data: producto,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listProductos,
  listPublicProductos,
  getProducto,
  getPublicProducto,
  createProducto,
  updateProducto,
  updateProductoStatus,
  deleteProducto,
  reactivateProducto,
};
