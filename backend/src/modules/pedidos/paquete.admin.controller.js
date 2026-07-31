const paqueteAdminService = require('./paquete.admin.service');

async function createPackage(req, res, next) {
  try {
    const created = await paqueteAdminService.createPackage(req.body);
    return res.status(201).json({
      ok: true,
      message: 'Paquete creado correctamente.',
      data: created,
    });
  } catch (error) {
    return next(error);
  }
}

async function listPackages(_req, res, next) {
  try {
    const packages = await paqueteAdminService.listPackages();
    return res.status(200).json({
      ok: true,
      data: packages,
    });
  } catch (error) {
    return next(error);
  }
}

async function getPackageById(req, res, next) {
  try {
    const pkg = await paqueteAdminService.getPackageById(req.params.packageId);
    return res.status(200).json({
      ok: true,
      data: pkg,
    });
  } catch (error) {
    return next(error);
  }
}

async function deletePackage(req, res, next) {
  try {
    const deleted = await paqueteAdminService.deletePackage(req.params.packageId);
    return res.status(200).json({
      ok: true,
      message: 'Paquete eliminado correctamente.',
      data: deleted,
    });
  } catch (error) {
    return next(error);
  }
}

async function getProductTypeCatalog(_req, res, next) {
  try {
    const items = await paqueteAdminService.getProductTypeCatalog();
    return res.status(200).json({
      ok: true,
      data: items,
    });
  } catch (error) {
    return next(error);
  }
}

async function getUnitTypeCatalog(_req, res, next) {
  try {
    const items = await paqueteAdminService.getUnitTypeCatalog();
    return res.status(200).json({
      ok: true,
      data: items,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createPackage,
  listPackages,
  getPackageById,
  deletePackage,
  getProductTypeCatalog,
  getUnitTypeCatalog,
};