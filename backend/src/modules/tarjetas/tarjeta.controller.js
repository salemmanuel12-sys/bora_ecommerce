const tarjetaService = require('./tarjeta.service');

async function listTarjetas(req, res, next) {
  try {
    const rows = await tarjetaService.listTarjetas(req.usuario.id);
    return res.status(200).json({ ok: true, data: rows });
  } catch (error) {
    return next(error);
  }
}

async function getTarjeta(req, res, next) {
  try {
    const tarjeta = await tarjetaService.getTarjeta(req.usuario.id, Number(req.params.tarjetaId));
    return res.status(200).json({ ok: true, data: tarjeta });
  } catch (error) {
    return next(error);
  }
}

async function createTarjeta(req, res, next) {
  try {
    const tarjeta = await tarjetaService.createTarjeta(req.usuario.id, req.body);
    return res.status(201).json({
      ok: true,
      message: 'Tarjeta guardada correctamente.',
      data: tarjeta,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateTarjeta(req, res, next) {
  try {
    const tarjeta = await tarjetaService.updateTarjeta(
      req.usuario.id,
      Number(req.params.tarjetaId),
      req.body
    );
    return res.status(200).json({
      ok: true,
      message: 'Tarjeta actualizada.',
      data: tarjeta,
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteTarjeta(req, res, next) {
  try {
    await tarjetaService.deleteTarjeta(req.usuario.id, Number(req.params.tarjetaId));
    return res.status(200).json({ ok: true, message: 'Tarjeta eliminada.' });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listTarjetas,
  getTarjeta,
  createTarjeta,
  updateTarjeta,
  deleteTarjeta,
};
