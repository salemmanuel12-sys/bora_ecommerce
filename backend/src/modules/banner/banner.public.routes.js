const express = require('express');
const bannerController = require('./banner.controller');

const router = express.Router();

router.get('/public', bannerController.listPublicBanners);

module.exports = router;
