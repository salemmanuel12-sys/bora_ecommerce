const subcategoriaService = require('./subcategoria.service');
const HttpError = require('../../utils/httpError');

function assertSuperAdmin(req) {
  if (Number(req.admin?.rol) !== 1) {
    throw new HttpError(403, 'Solo el superadmin puede gestionar subcategorias.');
  }
}

async function listSubcategorias(req, res, next) {
  try {
    const result = await subcategoriaService.listSubcategorias({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      includeInactive: req.query.include_inactive,
      categoriaId: req.query.categoriaId,
    });

    return res.status(200).json({
      ok: true,
      data: result.subcategorias,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
}

async function getSubcategoria(req, res, next) {
  try {
    const subcategoria = await subcategoriaService.getSubcategoriaById(req.params.subcategoriaId);

    return res.status(200).json({
      ok: true,
      data: subcategoria,
    });
  } catch (error) {
    return next(error);
  }
}

async function createSubcategoria(req, res, next) {
  try {
    assertSuperAdmin(req);

    const subcategoria = await subcategoriaService.createSubcategoria({
      categoriaId: req.body.categoriaId,
      name: req.body.name,
      description: req.body.description,
      status: req.body.status,
    });

    return res.status(201).json({
      ok: true,
      message: 'Subcategoria creada correctamente.',
      data: subcategoria,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateSubcategoria(req, res, next) {
  try {
    assertSuperAdmin(req);

    const subcategoria = await subcategoriaService.updateSubcategoria({
      subcategoriaId: req.params.subcategoriaId,
      categoriaId: req.body.categoriaId,
      name: req.body.name,
      description: req.body.description,
      status: req.body.status,
    });

    return res.status(200).json({
      ok: true,
      message: 'Subcategoria actualizada correctamente.',
      data: subcategoria,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateSubcategoriaStatus(req, res, next) {
  try {
    assertSuperAdmin(req);

    const subcategoria = await subcategoriaService.updateSubcategoriaStatus({
      subcategoriaId: req.params.subcategoriaId,
      status: req.body.status,
    });

    return res.status(200).json({
      ok: true,
      message: 'Status de subcategoria actualizado correctamente.',
      data: subcategoria,
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteSubcategoria(req, res, next) {
  try {
    assertSuperAdmin(req);

    await subcategoriaService.deleteSubcategoria({
      subcategoriaId: req.params.subcategoriaId,
    });

    return res.status(200).json({
      ok: true,
      message: 'Subcategoria eliminada correctamente.',
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listSubcategorias,
  getSubcategoria,
  createSubcategoria,
  updateSubcategoria,
  updateSubcategoriaStatus,
  deleteSubcategoria,
};
