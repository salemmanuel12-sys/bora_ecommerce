const express = require('express');
const adminAuthMiddleware = require('../../middlewares/adminAuth.middleware');
const controller = require('./admin.permiso.controller');

const router = express.Router({ mergeParams: true });

router.use(adminAuthMiddleware);
router.post('/', controller.createSubmodulo);
router.patch('/:submoduloId/status', controller.setSubmoduloStatus);

module.exports = router;
