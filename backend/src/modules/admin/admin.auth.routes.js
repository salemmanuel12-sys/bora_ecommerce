const express = require('express');
const adminAuthMiddleware = require('../../middlewares/adminAuth.middleware');
const {
	validateLogin,
	validateRefreshToken,
	validateRequestReset,
	validateVerifyResetCode,
	validateResetPassword,
	validateChangePassword,
} = require('../../middlewares/adminValidation.middleware');
const {
	loginLimiter,
	refreshLimiter,
	resetLimiter,
} = require('../../middlewares/adminRateLimit.middleware');
const adminAuthController = require('./admin.auth.controller');
const adminInvitationController = require('./admin.invitation.controller');

const router = express.Router();

router.post('/login', loginLimiter, validateLogin, adminAuthController.login);
router.post('/refresh', refreshLimiter, validateRefreshToken, adminAuthController.refresh);
router.post('/logout', validateRefreshToken, adminAuthController.logout);

router.post('/request-reset', resetLimiter, validateRequestReset, adminAuthController.requestReset);
router.post('/verify-reset-code', resetLimiter, validateVerifyResetCode, adminAuthController.verifyCode);
router.post('/reset-password', resetLimiter, validateResetPassword, adminAuthController.resetPassword);

router.get('/me', adminAuthMiddleware, adminAuthController.me);
router.post('/logout-all', adminAuthMiddleware, adminAuthController.logoutAll);
router.get('/sessions', adminAuthMiddleware, adminAuthController.listSessions);
router.delete('/sessions/:sessionId', adminAuthMiddleware, adminAuthController.revokeSession);
router.put('/change-password', adminAuthMiddleware, validateChangePassword, adminAuthController.changePassword);
router.get('/password-change-requests', adminAuthMiddleware, adminAuthController.listPasswordChangeRequests);
router.put('/password-change-requests/:adminId/approve', adminAuthMiddleware, adminAuthController.approvePasswordChangeRequest);
router.put('/password-change-requests/:adminId/reject', adminAuthMiddleware, adminAuthController.rejectPasswordChangeRequest);
// Rutas de invitación y registro de administradores
router.post('/invitation/send', adminAuthMiddleware, adminInvitationController.sendInvitation);
router.post('/register', adminInvitationController.registerFromInvitation);
router.post('/verify-email', adminInvitationController.verifyEmailAdmin);
router.post('/approve/:adminId', adminAuthMiddleware, adminInvitationController.approveAdmin);
router.post('/reject/:adminId', adminAuthMiddleware, adminInvitationController.rejectAdmin);
router.get('/list', adminAuthMiddleware, adminInvitationController.listAdmins);

module.exports = router;
