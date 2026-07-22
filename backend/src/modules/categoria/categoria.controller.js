const categoriaService = require('./categoria.service');
const HttpError = require('../../utils/httpError');

function assertSuperAdmin(req) {
  if (Number(req.admin?.rol) !== 1) {
    throw new HttpError(403, 'Solo el superadmin puede gestionar categorias.');
  }
}

async function listPublicCategorias(req, res, next) {
  try {
    const result = await categoriaService.listCategorias({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      includeInactive: false,
    });

    return res.status(200).json({
      ok: true,
      data: result.categorias,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
}

async function listCategorias(req, res, next) {
  try {
    const result = await categoriaService.listCategorias({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      includeInactive: req.query.include_inactive,
    });

    return res.status(200).json({
      ok: true,
      data: result.categorias,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
}

async function getCategoria(req, res, next) {
  try {
    const categoria = await categoriaService.getCategoriaById(req.params.categoriaId);

    return res.status(200).json({
      ok: true,
      data: categoria,
    });
  } catch (error) {
    return next(error);
  }
}

async function createCategoria(req, res, next) {
  try {
    assertSuperAdmin(req);

    const categoria = await categoriaService.createCategoria({
      name: req.body.name,
      description: req.body.description,
      imageUrl: req.file
        ? `categorias/${req.file.filename}`
        : (req.body?.imageUrl === undefined ? undefined : req.body.imageUrl),
      status: req.body.status,
    });

    return res.status(201).json({
      ok: true,
      message: 'Categoria creada correctamente.',
      data: categoria,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateCategoria(req, res, next) {
  try {
    assertSuperAdmin(req);

    const categoria = await categoriaService.updateCategoria({
      categoriaId: req.params.categoriaId,
      name: req.body.name,
      description: req.body.description,
      imageUrl: req.file
        ? `categorias/${req.file.filename}`
        : (req.body?.imageUrl === undefined ? undefined : req.body.imageUrl),
      status: req.body.status,
    });

    return res.status(200).json({
      ok: true,
      message: 'Categoria actualizada correctamente.',
      data: categoria,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateCategoriaStatus(req, res, next) {
  try {
    assertSuperAdmin(req);

    const categoria = await categoriaService.updateCategoriaStatus({
      categoriaId: req.params.categoriaId,
      status: req.body.status,
    });

    return res.status(200).json({
      ok: true,
      message: 'Status de categoria actualizado correctamente.',
      data: categoria,
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteCategoria(req, res, next) {
  try {
    assertSuperAdmin(req);

    await categoriaService.deleteCategoria({
      categoriaId: req.params.categoriaId,
    });

    return res.status(200).json({
      ok: true,
      message: 'Categoria eliminada correctamente.',
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listPublicCategorias,
  listCategorias,
  getCategoria,
  createCategoria,
  updateCategoria,
  updateCategoriaStatus,
  deleteCategoria,
};
