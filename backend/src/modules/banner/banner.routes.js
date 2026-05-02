const express = require('express');
const adminAuthMiddleware = require('../../middlewares/adminAuth.middleware');
const {
  validateBannerIdParam,
  validateCreateBanner,
  validateUpdateBanner,
  validateBannerStatus,
  validateListBannersQuery,
} = require('../../middlewares/bannerValidation.middleware');
const { handleUploadBannerImagen } = require('../../middlewares/upload.middleware');
const bannerController = require('./banner.controller');

const router = express.Router();

router.use(adminAuthMiddleware);

router.get('/', validateListBannersQuery, bannerController.listBanners);
router.get('/:bannerId', validateBannerIdParam, bannerController.getBanner);
router.post('/', handleUploadBannerImagen, validateCreateBanner, bannerController.createBanner);
router.put('/:bannerId', validateBannerIdParam, handleUploadBannerImagen, validateUpdateBanner, bannerController.updateBanner);
router.patch('/:bannerId/status', validateBannerStatus, bannerController.updateBannerStatus);
router.delete('/:bannerId', validateBannerIdParam, bannerController.deleteBanner);

module.exports = router;
