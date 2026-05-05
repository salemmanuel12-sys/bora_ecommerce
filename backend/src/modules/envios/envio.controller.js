const envioService = require('./envio.service');

async function getShipment(req, res, next) {
  try {
    const shipment = await envioService.getShipmentByOrder(
      req.usuario.id,
      Number(req.params.orderId)
    );
    return res.status(200).json({ ok: true, data: shipment ?? null });
  } catch (error) {
    return next(error);
  }
}

// Admin: create or update shipment
async function upsertShipment(req, res, next) {
  try {
    const shipment = await envioService.upsertShipment(Number(req.params.orderId), {
      carrier: req.body.carrier,
      trackingNumber: req.body.trackingNumber,
      status: req.body.status,
    });
    return res.status(200).json({
      ok: true,
      message: 'Envío actualizado correctamente.',
      data: shipment,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getShipment, upsertShipment };
