const productoOpinionService = require('./productoOpinion.service');

async function listPublicByProducto(req, res, next) {
  try {
    const result = await productoOpinionService.listPublicOpinionesByProducto(req.params.productoId, {
      page: req.query.page,
      limit: req.query.limit,
    });

    return res.status(200).json({
      ok: true,
      data: result.opiniones,
      resumen: result.resumen,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
}

async function listMisOpiniones(req, res, next) {
  try {
    const result = await productoOpinionService.listMisOpiniones(req.usuario.id, {
      page: req.query.page,
      limit: req.query.limit,
    });

    return res.status(200).json({
      ok: true,
      data: result.opiniones,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
}

async function upsertMiOpinion(req, res, next) {
  try {
    const opinion = await productoOpinionService.upsertMiOpinion({
      userId: req.usuario.id,
      productoId: req.params.productoId,
      rating: req.body.rating,
      title: req.body.title,
      comment: req.body.comment,
    });

    return res.status(201).json({
      ok: true,
      message: 'Opinion guardada correctamente y enviada a revision.',
      data: opinion,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateMiOpinion(req, res, next) {
  try {
    const opinion = await productoOpinionService.updateMiOpinion({
      userId: req.usuario.id,
      opinionId: req.params.opinionId,
      rating: req.body.rating,
      title: req.body.title,
      comment: req.body.comment,
    });

    return res.status(200).json({
      ok: true,
      message: 'Opinion actualizada y enviada a revision.',
      data: opinion,
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteMiOpinion(req, res, next) {
  try {
    const result = await productoOpinionService.deleteMiOpinion({
      userId: req.usuario.id,
      opinionId: req.params.opinionId,
    });

    return res.status(200).json({ ok: true, message: result.message });
  } catch (error) {
    return next(error);
  }
}

async function adminListPendientes(req, res, next) {
  try {
    const result = await productoOpinionService.adminListPendientes({
      page: req.query.page,
      limit: req.query.limit,
    });

    return res.status(200).json({
      ok: true,
      data: result.opiniones,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
}

async function adminUpdateStatus(req, res, next) {
  try {
    const opinion = await productoOpinionService.adminUpdateStatus({
      opinionId: req.params.opinionId,
      status: req.body.status,
    });

    return res.status(200).json({
      ok: true,
      message: 'Estado de opinion actualizado correctamente.',
      data: opinion,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listPublicByProducto,
  listMisOpiniones,
  upsertMiOpinion,
  updateMiOpinion,
  deleteMiOpinion,
  adminListPendientes,
  adminUpdateStatus,
};
