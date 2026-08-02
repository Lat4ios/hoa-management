const express = require('express');
const router = express.Router();
const AccountController = require('../controllers/accountController');

// ─── ACCOUNT MANAGEMENT PAGE ──────────────────────────────────────────────────
router.get('/', AccountController.getAccountManagement);

// ─── ADMIN ACCOUNTS ──────────────────────────────────────────────────────────
router.post('/admin', AccountController.createAdmin);
router.post('/admin/:id/update', AccountController.updateAdmin);
router.post('/admin/:id/reset-password', AccountController.resetAdminPassword);
router.post('/admin/:id/delete', AccountController.deleteAdmin);

// ─── BOARD MEMBER ACCOUNTS ──────────────────────────────────────────────────
router.post('/board-member', AccountController.createBoardMemberAccount);
router.post('/board-member/:id/update', AccountController.updateBoardMemberAccount);
router.post('/board-member/:id/reset-password', AccountController.resetBoardMemberPassword);
router.post('/board-member/:id/delete', AccountController.deleteBoardMemberAccount);

// ─── ADMIN CONTACT INFO ──────────────────────────────────────────────────────
router.post('/admin-contact', AccountController.updateAdminContactInfo);

module.exports = router;