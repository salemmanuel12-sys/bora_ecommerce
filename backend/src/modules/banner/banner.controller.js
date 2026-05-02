const bannerService = require('./banner.service');
const HttpError = require('../../utils/httpError');

function assertSuperAdmin(req) {
  if (Number(req.admin?.rol) !== 1) {
    throw new HttpError(403, 'Solo el superadmin puede gestionar banners.');
  }
}

async function listBanners(req, res, next) {
  try {
    const result = await bannerService.listBanners({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      includeInactive: req.query.include_inactive,
    });

    return res.status(200).json({
      ok: true,
      data: result.banners,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
}

async function listPublicBanners(_req, res, next) {
  try {
    const rows = await bannerService.listPublicBanners();

    return res.status(200).json({
      ok: true,
      data: rows,
    });
  } catch (error) {
    return next(error);
  }
}

async function getBanner(req, res, next) {
  try {
    const banner = await bannerService.getBannerById(req.params.bannerId);

    return res.status(200).json({
      ok: true,
      data: banner,
    });
  } catch (error) {
    return next(error);
  }
}

async function createBanner(req, res, next) {
  try {
    assertSuperAdmin(req);

    const banner = await bannerService.createBanner({
      title: req.body.title,
      description: req.body.description,
      ctaText: req.body.ctaText,
      ctaLink: req.body.ctaLink,
      orden: req.body.orden,
      status: req.body.status,
      file: req.file,
    });

    return res.status(201).json({
      ok: true,
      message: 'Banner creado correctamente.',
      data: banner,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateBanner(req, res, next) {
  try {
    assertSuperAdmin(req);

    const banner = await bannerService.updateBanner({
      bannerId: req.params.bannerId,
      title: req.body.title,
      description: req.body.description,
      ctaText: req.body.ctaText,
      ctaLink: req.body.ctaLink,
      orden: req.body.orden,
      status: req.body.status,
      file: req.file,
    });

    return res.status(200).json({
      ok: true,
      message: 'Banner actualizado correctamente.',
      data: banner,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateBannerStatus(req, res, next) {
  try {
    assertSuperAdmin(req);

    const banner = await bannerService.updateBannerStatus({
      bannerId: req.params.bannerId,
      status: req.body.status,
    });

    return res.status(200).json({
      ok: true,
      message: 'Status de banner actualizado correctamente.',
      data: banner,
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteBanner(req, res, next) {
  try {
    assertSuperAdmin(req);

    const result = await bannerService.deleteBanner({
      bannerId: req.params.bannerId,
    });

    return res.status(200).json({
      ok: true,
      message: result.message,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listBanners,
  listPublicBanners,
  getBanner,
  createBanner,
  updateBanner,
  updateBannerStatus,
  deleteBanner,
};
