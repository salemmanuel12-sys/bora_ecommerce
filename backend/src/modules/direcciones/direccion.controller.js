const direccionService = require('./direccion.service');

async function listAddresses(req, res, next) {
  try {
    const addresses = await direccionService.listAddresses(req.usuario.id);
    return res.status(200).json({ ok: true, data: addresses });
  } catch (error) {
    return next(error);
  }
}

async function createAddress(req, res, next) {
  try {
    const address = await direccionService.createAddress(req.usuario.id, req.body);
    return res.status(201).json({
      ok: true,
      message: 'Dirección creada correctamente.',
      data: address,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateAddress(req, res, next) {
  try {
    const address = await direccionService.updateAddress(
      req.usuario.id,
      Number(req.params.addressId),
      req.body
    );
    return res.status(200).json({
      ok: true,
      message: 'Dirección actualizada.',
      data: address,
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteAddress(req, res, next) {
  try {
    await direccionService.deleteAddress(req.usuario.id, Number(req.params.addressId));
    return res.status(200).json({ ok: true, message: 'Dirección eliminada.' });
  } catch (error) {
    return next(error);
  }
}

module.exports = { listAddresses, createAddress, updateAddress, deleteAddress };
